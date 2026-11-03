"""
quizzes/admin.py
-----------------
Enregistre les modèles Quiz et Question dans l'admin Django.
Les questions sont affichées "inline" directement dans la page du quiz.
"""

from django.contrib import admin

from .models import Quiz, Question


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ["title", "course", "validated", "created_at"]
    list_filter = ["validated"]
    search_fields = ["title"]
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text", "quiz", "type"]
    list_filter = ["type"]
