"""
quizzes/serializers.py
------------------------
Sérialiseurs pour les Quiz et leurs Questions.
QuizSerializer imbrique les questions (nested serializer) pour pouvoir créer
ou afficher un quiz complet en une seule requête.
"""

from rest_framework import serializers

from .models import Quiz, Question


class QuestionSerializer(serializers.ModelSerializer):
    """Sérialise une question individuelle (QCM, Vrai/Faux ou ouverte)."""

    class Meta:
        model = Question
        fields = ["id", "type", "text", "choices", "correct_answer", "explanation", "order"]


class QuizSerializer(serializers.ModelSerializer):
    """
    Sérialiseur complet d'un quiz, avec ses questions imbriquées.
    La création "manuelle" (hors IA) est possible en envoyant une liste de questions.
    """

    questions = QuestionSerializer(many=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Quiz
        fields = ["id", "course", "course_title", "title", "validated", "questions", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        """Crée le quiz puis toutes ses questions associées en une seule opération."""
        questions_data = validated_data.pop("questions")
        quiz = Quiz.objects.create(**validated_data)
        for index, question_data in enumerate(questions_data):
            Question.objects.create(quiz=quiz, order=index, **question_data)
        return quiz

    def update(self, instance, validated_data):
        """
        Met à jour le quiz. Si des questions sont fournies, on remplace
        l'intégralité des questions existantes (plus simple et plus sûr qu'un diff fin).
        """
        questions_data = validated_data.pop("questions", None)

        instance.title = validated_data.get("title", instance.title)
        instance.validated = validated_data.get("validated", instance.validated)
        instance.save()

        if questions_data is not None:
            instance.questions.all().delete()
            for index, question_data in enumerate(questions_data):
                Question.objects.create(quiz=instance, order=index, **question_data)

        return instance


class QuizValidateSerializer(serializers.Serializer):
    """Petit sérialiseur utilisé uniquement pour l'action de validation manuelle du quiz."""

    validated = serializers.BooleanField()
