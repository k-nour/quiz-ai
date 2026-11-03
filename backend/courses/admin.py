"""
courses/admin.py
-----------------
Enregistre le modèle Course dans l'admin Django pour une supervision rapide.
"""

from django.contrib import admin

from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "subject", "level", "created_at"]
    list_filter = ["subject", "level"]
    search_fields = ["title", "content"]
