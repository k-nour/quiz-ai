"""
courses/tests.py
-----------------
Tests du CRUD des cours, des droits (enseignant / élève) et de l'isolation des données.
"""

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .models import Course


class CourseTests(APITestCase):

    def setUp(self):
        self.prof = User.objects.create_user(
            username="prof", email="prof@test.fr", password="MotDePasse123", role="enseignant"
        )
        self.autre_prof = User.objects.create_user(
            username="prof_b", email="profb@test.fr", password="MotDePasse123", role="enseignant"
        )
        self.eleve = User.objects.create_user(
            username="eleve", email="eleve@test.fr", password="MotDePasse123", role="eleve"
        )
        self.cours = Course.objects.create(
            title="Les réseaux", content="Un réseau relie plusieurs ordinateurs entre eux.",
            subject="Informatique", level="lycee", author=self.prof,
        )

    def test_enseignant_cree_un_cours(self):
        self.client.force_authenticate(self.prof)
        data = {"title": "Python", "content": "Python est un langage de programmation simple.",
                "subject": "Informatique", "level": "lycee"}
        response = self.client.post("/api/courses/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # L'auteur est mis automatiquement, pas envoyé par le client
        self.assertEqual(response.data["author"], self.prof.id)

    def test_contenu_trop_court_refuse(self):
        self.client.force_authenticate(self.prof)
        response = self.client.post("/api/courses/", {"title": "Test", "content": "court"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eleve_ne_peut_pas_creer(self):
        self.client.force_authenticate(self.eleve)
        data = {"title": "Triche", "content": "Un élève essaie de créer un cours ici."}
        response = self.client.post("/api/courses/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_eleve_voit_le_catalogue(self):
        self.client.force_authenticate(self.eleve)
        response = self.client.get("/api/courses/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_un_prof_ne_voit_pas_les_cours_d_un_autre(self):
        self.client.force_authenticate(self.autre_prof)
        response = self.client.get(f"/api/courses/{self.cours.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        response = self.client.delete(f"/api/courses/{self.cours.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Course.objects.filter(pk=self.cours.pk).exists())

    def test_recherche_et_filtre(self):
        self.client.force_authenticate(self.prof)
        response = self.client.get("/api/courses/?search=réseau&subject=info")
        self.assertEqual(response.data["count"], 1)
        response = self.client.get("/api/courses/?search=mathématiques")
        self.assertEqual(response.data["count"], 0)

    def test_import_fichier_txt(self):
        self.client.force_authenticate(self.prof)
        fichier = SimpleUploadedFile("cours.txt", "Le protocole HTTP sert au web.".encode("utf-8"))
        response = self.client.post("/api/courses/import-file/", {"file": fichier}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("HTTP", response.data["content"])

    def test_import_mauvais_format(self):
        self.client.force_authenticate(self.prof)
        fichier = SimpleUploadedFile("virus.exe", b"MZ....")
        response = self.client.post("/api/courses/import-file/", {"file": fichier}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
