"""
courses/models.py
------------------
Modèle "Course" (Cours) : la ressource pédagogique principale de l'application.
Un enseignant rédige un cours (titre + contenu texte), le classe par matière
et niveau scolaire, puis peut générer un quiz à partir de son contenu.
"""

from django.conf import settings
from django.db import models


class Course(models.Model):
    """Un cours/leçon rédigé par un enseignant, utilisé comme base pour générer un quiz IA."""

    NIVEAUX = [
        ("primaire", "Primaire"),
        ("college", "Collège"),
        ("lycee", "Lycée"),
        ("superieur", "Enseignement supérieur"),
    ]

    title = models.CharField("titre", max_length=200)
    content = models.TextField("contenu du cours")
    subject = models.CharField("matière", max_length=100, blank=True)
    level = models.CharField("niveau scolaire", max_length=20, choices=NIVEAUX, blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
        verbose_name="auteur",
    )

    created_at = models.DateTimeField("créé le", auto_now_add=True)
    updated_at = models.DateTimeField("modifié le", auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Cours"
        verbose_name_plural = "Cours"

    def __str__(self):
        return self.title
