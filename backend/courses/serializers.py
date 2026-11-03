"""
courses/serializers.py
-----------------------
Sérialiseur du modèle Course : valide les données entrantes (titre, contenu)
et formate les données sortantes (ajout du nombre de quiz liés, par exemple).
"""

from rest_framework import serializers

from .models import Course


class CourseSerializer(serializers.ModelSerializer):
    """Sérialiseur complet utilisé pour la liste, la création, l'édition et le détail d'un cours."""

    author_name = serializers.CharField(source="author.username", read_only=True)
    quiz_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "content",
            "subject",
            "level",
            "author",
            "author_name",
            "quiz_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "author", "created_at", "updated_at"]

    def get_quiz_count(self, obj):
        """Retourne le nombre de quiz déjà générés à partir de ce cours."""
        return obj.quizzes.count()

    def validate_title(self, value):
        """Le titre doit faire au moins 3 caractères."""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Le titre doit contenir au moins 3 caractères.")
        return value

    def validate_content(self, value):
        """Le contenu doit être suffisamment long pour permettre une génération de quiz pertinente."""
        if len(value.strip()) < 20:
            raise serializers.ValidationError(
                "Le contenu du cours doit contenir au moins 20 caractères."
            )
        return value
