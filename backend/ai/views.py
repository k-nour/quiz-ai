"""
ai/views.py
------------
Endpoint POST /api/ai/generate qui déclenche la génération d'un quiz par l'IA (Ollama)
à partir du contenu d'un cours, et renvoie la réponse en streaming (chunked response)
pour un affichage progressif côté React (comme un "effet machine à écrire").
"""

import json

from django.http import StreamingHttpResponse, JsonResponse
from rest_framework import permissions, status
from rest_framework.views import APIView

from .services import build_quiz_prompt, stream_ollama_generation


class GenerateQuizView(APIView):
    """
    Reçoit le texte du cours + la configuration du quiz voulu (nombre de questions
    par type, difficulté), puis relaie la génération IA en streaming vers le front-end.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Seuls les enseignants peuvent générer un quiz : les élèves sont en lecture seule.
        if request.user.role != "enseignant":
            return JsonResponse(
                {"error": "Seuls les enseignants peuvent générer un quiz avec l'IA."},
                status=status.HTTP_403_FORBIDDEN,
            )

        content = request.data.get("content", "").strip()
        if not content:
            return JsonResponse(
                {"error": "Le contenu du cours est requis pour générer un quiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mix de questions "configurable par l'utilisateur" (valeurs par défaut raisonnables sinon)
        nb_qcm = int(request.data.get("nb_qcm", 4))
        nb_vrai_faux = int(request.data.get("nb_vrai_faux", 3))
        nb_ouvertes = int(request.data.get("nb_ouvertes", 2))
        difficulty = request.data.get("difficulty", "intermédiaire")

        prompt = build_quiz_prompt(content, nb_qcm, nb_vrai_faux, nb_ouvertes, difficulty)

        def event_stream():
            """Encapsule le générateur du service pour renvoyer une erreur JSON propre en cas d'échec."""
            try:
                for piece in stream_ollama_generation(prompt):
                    yield piece
            except (ConnectionError, TimeoutError) as exc:
                # On envoie un "objet erreur" reconnaissable par le front (préfixé) pour l'afficher proprement
                yield f"\n[[ERREUR_IA]]{json.dumps({'error': str(exc)})}"

        response = StreamingHttpResponse(event_stream(), content_type="text/plain; charset=utf-8")
        # Empêche la mise en cache/buffering par certains proxys, pour un vrai streaming
        response["X-Accel-Buffering"] = "no"
        response["Cache-Control"] = "no-cache"
        return response
