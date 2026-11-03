"""
users/views.py
---------------
Vues (endpoints) liées à l'authentification et à la gestion du profil utilisateur.

- RegisterView       : POST /api/auth/register   -> crée un compte
- (login géré par simplejwt directement dans urls.py, pas besoin de vue custom)
- MeView             : GET  /api/auth/me         -> infos de l'utilisateur connecté
- UpdateProfileView  : PATCH /api/users/me        -> modifier nom/email
- ExportDataView     : GET  /api/users/me/export  -> export JSON de ses données (RGPD)
- DeleteAccountView  : POST /api/users/me/delete  -> suppression définitive du compte
"""

from django.http import JsonResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from courses.models import Course
from quizzes.models import Quiz
from .models import User
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    DeleteAccountSerializer,
)


class LogoutView(APIView):
    """
    Déconnexion : place le refresh token dans la liste noire (blacklist) pour
    qu'il ne puisse plus jamais être réutilisé, même s'il n'est pas encore expiré.
    Le front-end supprime aussi les tokens de son localStorage de son côté.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
        except (KeyError, TokenError):
            return Response(
                {"error": "Refresh token manquant ou invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"message": "Déconnexion réussie."}, status=status.HTTP_205_RESET_CONTENT)


class RegisterView(generics.CreateAPIView):
    """Inscription : n'importe qui (non authentifié) peut créer un compte."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    """Retourne les informations de l'utilisateur actuellement connecté (via son JWT)."""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UpdateProfileView(generics.UpdateAPIView):
    """Permet à l'utilisateur connecté de modifier son nom et son email."""

    serializer_class = UpdateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ExportDataView(APIView):
    """
    Conformité RGPD : permet à l'utilisateur de télécharger toutes ses données
    personnelles (profil, cours, quiz) au format JSON.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "profil": UserProfileSerializer(user).data,
            "cours": list(Course.objects.filter(author=user).values()),
            "quiz": list(Quiz.objects.filter(course__author=user).values()),
        }
        response = JsonResponse(data, json_dumps_params={"indent": 2, "default": str})
        response["Content-Disposition"] = 'attachment; filename="mes_donnees_eduquizai.json"'
        return response


class DeleteAccountView(APIView):
    """
    Suppression définitive et irréversible du compte.
    Nécessite de taper "SUPPRIMER" dans le corps de la requête pour confirmer.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request.user.delete()
        return Response(
            {"message": "Votre compte a été supprimé définitivement."},
            status=status.HTTP_200_OK,
        )
