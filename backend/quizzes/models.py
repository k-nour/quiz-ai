"""
quizzes/models.py
------------------
Modèles Quiz et Question.
Un Quiz est généré (par l'IA) à partir d'un Course, et contient plusieurs Questions
de différents types (QCM, Vrai/Faux, question ouverte).
Le champ `validated` permet la "vérification humaine" demandée dans le cahier des
charges : un enseignant doit valider manuellement un quiz avant qu'il soit considéré
comme définitif.
"""

from django.db import models

from courses.models import Course


class Quiz(models.Model):
    """Un quiz généré à partir d'un cours."""

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="quizzes", verbose_name="cours associé"
    )
    title = models.CharField("titre du quiz", max_length=200)

    # Vérification humaine : un quiz généré par l'IA n'est pas validé par défaut.
    # L'enseignant doit le relire et cliquer sur "Valider" avant de le considérer comme fiable.
    validated = models.BooleanField("validé manuellement", default=False)

    created_at = models.DateTimeField("créé le", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Quiz"
        verbose_name_plural = "Quiz"

    def __str__(self):
        return self.title


class Question(models.Model):
    """Une question appartenant à un quiz. Le type détermine la structure des données stockées."""

    TYPES = [
        ("qcm", "QCM (choix multiple)"),
        ("vrai_faux", "Vrai / Faux"),
        ("ouverte", "Question ouverte"),
    ]

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    type = models.CharField("type de question", max_length=20, choices=TYPES)
    text = models.TextField("énoncé de la question")

    # Pour un QCM : liste des propositions, ex: ["Paris", "Lyon", "Marseille", "Nice"]
    # Pour Vrai/Faux : non utilisé (on utilise correct_answer = "vrai" ou "faux")
    choices = models.JSONField("propositions (QCM)", default=list, blank=True)

    # Réponse correcte : texte de la bonne proposition (QCM), "vrai"/"faux", ou vide pour une question ouverte
    correct_answer = models.TextField("réponse correcte", blank=True)

    # Explication pédagogique de la réponse (surtout utile pour le Vrai/Faux)
    explanation = models.TextField("explication", blank=True)

    order = models.PositiveIntegerField("ordre d'affichage", default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"[{self.get_type_display()}] {self.text[:50]}"
