"""
users/tests.py
---------------
Tests de l'inscription, de la connexion (JWT), de la déconnexion et du RGPD.
Lancer : python manage.py test
"""

from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class AuthTests(APITestCase):

    def setUp(self):
        # Un enseignant déjà inscrit pour les tests de connexion
        self.user = User.objects.create_user(
            username="prof1", email="prof1@test.fr", password="MotDePasse123", role="enseignant"
        )

    def test_inscription_ok(self):
        data = {
            "username": "nouveau",
            "email": "nouveau@test.fr",
            "password": "MotDePasse123",
            "role": "eleve",
        }
        response = self.client.post("/api/auth/register", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Le mot de passe ne doit jamais revenir dans la réponse
        self.assertNotIn("password", response.data)
        # Et il doit être haché en base (pas en clair)
        user = User.objects.get(email="nouveau@test.fr")
        self.assertNotEqual(user.password, "MotDePasse123")
        self.assertTrue(user.check_password("MotDePasse123"))

    def test_inscription_email_deja_utilise(self):
        data = {"username": "autre", "email": "prof1@test.fr", "password": "MotDePasse123"}
        response = self.client.post("/api/auth/register", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inscription_mot_de_passe_trop_court(self):
        data = {"username": "court", "email": "court@test.fr", "password": "abc"}
        response = self.client.post("/api/auth/register", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_connexion_ok_renvoie_les_tokens(self):
        response = self.client.post(
            "/api/auth/login", {"email": "prof1@test.fr", "password": "MotDePasse123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_connexion_mauvais_mot_de_passe(self):
        response = self.client.post(
            "/api/auth/login", {"email": "prof1@test.fr", "password": "mauvais_mdp"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_sans_token_refuse(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deconnexion_blacklist_le_refresh_token(self):
        login = self.client.post(
            "/api/auth/login", {"email": "prof1@test.fr", "password": "MotDePasse123"}, format="json"
        )
        refresh = login.data["refresh"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

        response = self.client.post("/api/auth/logout", {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

        # Le refresh token ne doit plus marcher après la déconnexion
        response = self.client.post("/api/auth/refresh", {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RgpdTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="prof2", email="prof2@test.fr", password="MotDePasse123"
        )
        self.client.force_authenticate(self.user)

    def test_export_des_donnees(self):
        response = self.client.get("/api/users/me/export")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("attachment", response["Content-Disposition"])

    def test_suppression_compte_sans_confirmation(self):
        response = self.client.post("/api/users/me/delete", {"confirmation": "oui"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())

    def test_suppression_compte_avec_confirmation(self):
        response = self.client.post("/api/users/me/delete", {"confirmation": "SUPPRIMER"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(pk=self.user.pk).exists())
