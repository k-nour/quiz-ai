"""
ai/tests.py
------------
Tests de l'endpoint de génération IA. On ne lance pas le vrai Ollama dans les tests :
on remplace la fonction d'appel par une fausse (mock), pour tester seulement notre code.
"""

from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User
from .services import build_quiz_prompt


class AiTests(APITestCase):

    def setUp(self):
        self.prof = User.objects.create_user(
            username="prof", email="prof@test.fr", password="MotDePasse123", role="enseignant"
        )
        self.eleve = User.objects.create_user(
            username="eleve", email="eleve@test.fr", password="MotDePasse123", role="eleve"
        )

    def test_prompt_contient_le_cours_et_les_nombres(self):
        prompt = build_quiz_prompt("Le soleil est une étoile.", 2, 1, 1, "facile")
        self.assertIn("Le soleil est une étoile.", prompt)
        self.assertIn("EXACTEMENT 4 question(s)", prompt)
        self.assertIn("facile", prompt)

    def test_eleve_ne_peut_pas_generer(self):
        self.client.force_authenticate(self.eleve)
        response = self.client.post("/api/ai/generate", {"content": "Un cours."}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_contenu_vide_refuse(self):
        self.client.force_authenticate(self.prof)
        response = self.client.post("/api/ai/generate", {"content": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("ai.views.stream_ollama_generation")
    def test_generation_en_streaming(self, fake_ollama):
        fake_ollama.return_value = iter(['{"title": "Quiz", ', '"questions": []}'])
        self.client.force_authenticate(self.prof)
        response = self.client.post("/api/ai/generate", {"content": "Le soleil est une étoile."}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        texte = b"".join(response.streaming_content).decode()
        self.assertEqual(texte, '{"title": "Quiz", "questions": []}')

    @patch("ai.views.stream_ollama_generation")
    def test_ollama_eteint_message_clair(self, fake_ollama):
        fake_ollama.side_effect = ConnectionError("Impossible de contacter Ollama.")
        self.client.force_authenticate(self.prof)
        response = self.client.post("/api/ai/generate", {"content": "Le soleil est une étoile."}, format="json")
        texte = b"".join(response.streaming_content).decode()
        self.assertIn("[[ERREUR_IA]]", texte)
        self.assertIn("Impossible de contacter Ollama", texte)
