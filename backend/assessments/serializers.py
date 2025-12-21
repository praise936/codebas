# backend/assessments/serializers.py
from rest_framework import serializers
from .models import Assessment, Question, TestCase, Submission

class TestCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCase
        fields = ['id', 'input_data', 'expected_output', 'is_hidden', 'points']
        read_only_fields = ['id']

class QuestionSerializer(serializers.ModelSerializer):
    test_cases = TestCaseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'assessment', 'title', 'description', 'question_type', 
                 'initial_code', 'language', 'points', 'order', 'test_cases']
        read_only_fields = ['id']

# Add a Create Question Serializer
class CreateQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['assessment', 'title', 'description', 'question_type', 
                 'initial_code', 'language', 'points', 'order']

class AssessmentSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Assessment
        fields = ['id', 'title', 'description', 'assessment_type', 'created_by', 
                 'created_by_name', 'time_limit', 'total_points', 'is_active', 
                 'created_at', 'questions']
        read_only_fields = ['id', 'created_at', 'created_by']

class SubmissionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    question_title = serializers.CharField(source='question.title', read_only=True)
    
    class Meta:
        model = Submission
        fields = ['id', 'question', 'question_title', 'user', 'user_name', 'code', 
                 'output', 'is_correct', 'score', 'submitted_at', 'time_taken']
        read_only_fields = ['id', 'submitted_at']

class CreateSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['question', 'code']