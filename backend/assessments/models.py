# backend/assessments/models.py
from django.db import models
from django.conf import settings

class Assessment(models.Model):
    ASSESSMENT_TYPES = [
        ('practice', 'Practice'),
        ('exam', 'Exam'),
        ('assignment', 'Assignment'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    assessment_type = models.CharField(max_length=20, choices=ASSESSMENT_TYPES, default='practice')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_assessments')
    time_limit = models.IntegerField(help_text="Time limit in minutes (0 for no limit)")
    total_points = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.assessment_type})"

class Question(models.Model):
    QUESTION_TYPES = [
        ('debugging', 'Debugging - Fix the bug'),
        ('coding', 'Coding Challenge - Write code'),
        ('multiple_choice', 'Multiple Choice'),
    ]
    
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    title = models.CharField(max_length=200)
    description = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='coding')
    initial_code = models.TextField(blank=True, help_text="Initial code for debugging tasks")
    language = models.CharField(max_length=20, default='python')
    points = models.IntegerField(default=10)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.title} ({self.question_type})"

class TestCase(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='test_cases')
    input_data = models.TextField(blank=True, help_text="Input for the program (if any)")
    expected_output = models.TextField(help_text="Expected output from the program")
    is_hidden = models.BooleanField(default=False, help_text="Hidden test case for grading")
    points = models.IntegerField(default=1)
    
    def __str__(self):
        return f"Test case for {self.question.title}"

class Submission(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='submissions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    code = models.TextField()
    output = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    score = models.IntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)
    time_taken = models.IntegerField(help_text="Time taken in seconds", default=0)
    
    class Meta:
        ordering = ['-submitted_at']
        unique_together = ['question', 'user']
    
    def __str__(self):
        return f"{self.user.username} - {self.question.title}"