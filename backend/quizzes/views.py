"""
quizzes/views.py
-----------------
CRUD complet des quiz + 2 actions supplémentaires :
- POST /api/quizzes/{id}/validate/  -> validation manuelle (vérification humaine)
- GET  /api/quizzes/{id}/export/?format=pdf|csv|json -> export du quiz
"""

import csv
import io

from django.http import JsonResponse, HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from courses.permissions import IsTeacherOrReadOnly

from .models import Quiz
from .serializers import QuizSerializer, QuizValidateSerializer


class QuizViewSet(viewsets.ModelViewSet):
    """
    CRUD complet des quiz.
    - Un ENSEIGNANT voit et gère tous les quiz liés à SES cours (validés ou non).
    - Un ÉLÈVE voit uniquement les quiz déjà VALIDÉS (vérification humaine effectuée),
      pour tous les cours, en lecture seule.
    """

    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.role == "enseignant":
            return Quiz.objects.filter(course__author=user)
        return Quiz.objects.filter(validated=True)

    @action(detail=True, methods=["post"])
    def validate(self, request, pk=None):
        """Action dédiée à la vérification humaine : marque le quiz comme validé (ou non)."""
        quiz = self.get_object()
        serializer = QuizValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quiz.validated = serializer.validated_data["validated"]
        quiz.save()
        return Response(QuizSerializer(quiz).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def export(self, request, pk=None):
        """Exporte le quiz au format demandé : ?format=json (défaut), csv ou pdf."""
        quiz = self.get_object()
        export_format = request.query_params.get("format", "json")

        if export_format == "csv":
            return self._export_csv(quiz)
        if export_format == "pdf":
            return self._export_pdf(quiz)
        return self._export_json(quiz)

    def _export_json(self, quiz):
        data = QuizSerializer(quiz).data
        response = JsonResponse(data, json_dumps_params={"indent": 2, "ensure_ascii": False})
        response["Content-Disposition"] = f'attachment; filename="{quiz.title}.json"'
        return response

    def _export_csv(self, quiz):
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["Type", "Question", "Propositions", "Réponse correcte", "Explication"])
        for q in quiz.questions.all():
            writer.writerow([q.type, q.text, " | ".join(q.choices), q.correct_answer, q.explanation])

        response = HttpResponse(buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{quiz.title}.csv"'
        return response

    def _export_pdf(self, quiz):
        # Import local pour ne charger reportlab que si nécessaire
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = [Paragraph(quiz.title, styles["Title"]), Spacer(1, 12)]

        for index, question in enumerate(quiz.questions.all(), start=1):
            elements.append(Paragraph(f"{index}. {question.text}", styles["Heading4"]))
            if question.type == "qcm":
                for choice in question.choices:
                    elements.append(Paragraph(f"— {choice}", styles["Normal"]))
            elements.append(Paragraph(f"Réponse : {question.correct_answer}", styles["Italic"]))
            if question.explanation:
                elements.append(Paragraph(f"Explication : {question.explanation}", styles["Normal"]))
            elements.append(Spacer(1, 10))

        doc.build(elements)
        buffer.seek(0)

        response = HttpResponse(buffer.read(), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{quiz.title}.pdf"'
        return response
