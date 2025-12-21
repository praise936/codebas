# backend/assessments/admin.py
from django.contrib import admin
from .models import Assessment, Question, TestCase, Submission

class TestCaseInline(admin.TabularInline):
    model = TestCase
    extra = 1

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    show_change_link = True

class QuestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'assessment', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'assessment']
    search_fields = ['title', 'description']
    inlines = [TestCaseInline]
    ordering = ['assessment', 'order']

class AssessmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'assessment_type', 'created_by', 'time_limit', 'is_active', 'created_at']
    list_filter = ['assessment_type', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    inlines = [QuestionInline]
    ordering = ['-created_at']

class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['user', 'question', 'score', 'is_correct', 'submitted_at']
    list_filter = ['is_correct', 'submitted_at']
    search_fields = ['user__username', 'question__title']
    readonly_fields = ['submitted_at']
    ordering = ['-submitted_at']

admin.site.register(Assessment, AssessmentAdmin)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Submission, SubmissionAdmin)
admin.site.register(TestCase)