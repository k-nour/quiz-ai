"""
quizzes/tests.py
-----------------
Tests des quiz : création avec questions, validation humaine, export, droits élève.
"""

from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Course
from users.models import User
from .models import Quiz, Question


class QuizTests(APITestCase):

    def setUp(self):
        self.prof = User.objects.create_user(
            username="prof", email="prof@test.fr", password="MotDePasse123", role="enseignant"
        )
        self.eleve = User.objects.create_user(
            username="eleve", email="eleve@test.fr", password="MotDePasse123", role="eleve"
        )
        self.cours = Course.objects.create(
            title="Les réseaux", content="Un réseau relie plusieurs ordinateurs entre eux.",
            author=self.prof,
        )
        self.quiz = Quiz.objects.create(course=self.cours, title="Quiz réseaux", validated=False)
        Question.objects.create(
            quiz=self.quiz, type="qcm", text="Que relie un réseau ?",
            choices=["Des ordinateurs", "Des tables", "Des stylos", "Rien"],
            correct_answer="Des ordinateurs",
        )

    def test_creer_quiz_avec_questions(self):
        self.client.force_authenticate(self.prof)
        data = {
            "course": self.cours.id,
            "title": "Nouveau quiz",
            "validated": False,
            "questions": [
                {"type": "vrai_faux", "text": "Un réseau relie des ordinateurs.", "choices": [],
                 "correct_answer": "vrai", "explanation": "C'est la définition du cours."},
                {"type": "ouverte", "text": "Donnez un exemple de réseau.", "choices": [],
                 "correct_answer": "Internet", "explanation": ""},
            ],
        }
        response = self.client.post("/api/quizzes/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["questions"]), 2)

    def test_validation_humaine(self):
        self.client.force_authenticate(self.prof)
        response = self.client.post(f"/api/quizzes/{self.quiz.id}/validate/", {"validated": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.quiz.refresh_from_db()
        self.assertTrue(self.quiz.validated)

    def test_eleve_ne_voit_pas_un_quiz_non_valide(self):
        self.client.force_authenticate(self.eleve)
        response = self.client.get("/api/quizzes/")
        self.assertEqual(response.data["count"], 0)

        self.quiz.validated = True
        self.quiz.save()
        response = self.client.get("/api/quizzes/")
        self.assertEqual(response.data["count"], 1)

    def test_eleve_ne_peut_pas_valider(self):
        self.quiz.validated = True
        self.quiz.save()
        self.client.force_authenticate(self.eleve)
        response = self.client.post(f"/api/quizzes/{self.quiz.id}/validate/", {"validated": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_export_csv_et_pdf(self):
        self.client.force_authenticate(self.prof)
        response = self.client.get(f"/api/quizzes/{self.quiz.id}/export/?format=csv")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

        response = self.client.get(f"/api/quizzes/{self.quiz.id}/export/?format=pdf")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.content.startswith(b"%PDF"))
