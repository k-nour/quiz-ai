"""
users/urls.py
--------------
Routes liées à l'authentification (register/login/refresh/logout) et au profil utilisateur.
Ces routes sont incluses depuis config/urls.py sous le préfixe /api/.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    MeView,
    UpdateProfileView,
    ExportDataView,
    DeleteAccountView,
    LogoutView,
)

urlpatterns = [
    # ---- Authentification ----
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    # Login : simplejwt gère directement la vérification email/mot de passe
    # et renvoie {"access": "...", "refresh": "..."}
    path("auth/login", TokenObtainPairView.as_view(), name="auth-login"),
    # Renouvelle un access token à partir d'un refresh token valide
    path("auth/refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me", MeView.as_view(), name="auth-me"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),

    # ---- Profil / Paramètres ----
    path("users/me", UpdateProfileView.as_view(), name="users-update-me"),
    path("users/me/export", ExportDataView.as_view(), name="users-export"),
    path("users/me/delete", DeleteAccountView.as_view(), name="users-delete"),
]
