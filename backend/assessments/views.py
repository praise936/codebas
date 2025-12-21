# backend/assessments/views.py
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.shortcuts import get_object_or_404
from .models import Assessment, Question, Submission
from .serializers import AssessmentSerializer, QuestionSerializer, SubmissionSerializer, CreateSubmissionSerializer

# Custom permission class
class IsInstructorOrReadOnly(BasePermission):
    """
    Custom permission to only allow instructors to create/edit.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions are only allowed to instructors.
        return request.user.user_type == 'instructor'

class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Assessment.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'instructor':
            # Instructors see their own assessments
            return Assessment.objects.filter(created_by=user)
        else:
            # Students see active assessments
            return Assessment.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    # Add this to check if user is instructor
    def create(self, request, *args, **kwargs):
        if request.user.user_type != 'instructor':
            return Response(
                {'error': 'Only instructors can create assessments'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    # ADD THIS METHOD - Get questions for a specific assessment
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """
        Get all questions for a specific assessment
        URL: /api/assessments/assessments/{id}/questions/
        """
        assessment = self.get_object()
        
        # Check if student can access (assessment must be active)
        if request.user.user_type == 'student' and not assessment.is_active:
            return Response(
                {'error': 'This assessment is not available'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        questions = assessment.questions.all()
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

# Update QuestionViewSet in assessments/views.py
class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    queryset = Question.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import CreateQuestionSerializer
            return CreateQuestionSerializer
        return QuestionSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Filter based on user type
        if user.user_type == 'instructor':
            # Instructors can see questions from their assessments
            return Question.objects.filter(assessment__created_by=user)
        else:
            # Students can see questions from active assessments
            return Question.objects.filter(assessment__is_active=True)
    
    def perform_create(self, serializer):
        # Get the assessment
        assessment_id = self.request.data.get('assessment')
        
        if not assessment_id:
            raise serializers.ValidationError({'assessment': 'This field is required.'})
        
        try:
            assessment = Assessment.objects.get(id=assessment_id)
            
            # Check if user is the creator of the assessment
            if assessment.created_by != self.request.user:
                raise serializers.ValidationError(
                    {'assessment': 'You can only add questions to your own assessments.'}
                )
            
            # Save the question
            serializer.save()
            
        except Assessment.DoesNotExist:
            raise serializers.ValidationError({'assessment': 'Assessment does not exist.'})

# backend/assessments/views.py - Fix the SubmissionViewSet grade_submission method
class SubmissionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Submission.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateSubmissionSerializer
        return SubmissionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'instructor':
            # Instructors can see all submissions
            return Submission.objects.all()
        else:
            # Students see only their own submissions
            return Submission.objects.filter(user=user)
    
    def perform_create(self, serializer):
        # Get the question
        question_id = self.request.data.get('question')
        if not question_id:
            raise serializers.ValidationError({'question': 'This field is required.'})
        
        try:
            question = Question.objects.get(id=question_id)
            
            # Check if student already submitted
            existing_submission = Submission.objects.filter(
                question=question, 
                user=self.request.user
            ).first()
            
            if existing_submission:
                raise serializers.ValidationError(
                    {'error': 'You have already submitted this question.'}
                )
            
            # Save the submission WITHOUT auto-grading
            submission = serializer.save(
                user=self.request.user,
                score=0,  # Default score until instructor grades
                is_correct=False  # Default until instructor grades
            )
            
            # Run code to get output but don't auto-grade
            try:
                from execution.services import CodeExecutor
                result = CodeExecutor.execute_python(submission.code)
                submission.output = result['output']
                
                # Save but don't set score or is_correct
                # Let instructor decide the grade
                submission.save()
                
            except Exception as e:
                submission.output = f"Execution error: {str(e)}"
                submission.save()
            
        except Question.DoesNotExist:
            raise serializers.ValidationError({'question': 'Question does not exist.'})