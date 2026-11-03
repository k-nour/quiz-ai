"""
users/serializers.py
---------------------
Les "serializers" DRF font la conversion entre les objets Python/Django (modèles)
et le JSON envoyé/reçu par l'API. Ils valident aussi les données entrantes
(ex : longueur du mot de passe, unicité de l'email).
"""

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """
    Valide et crée un nouvel utilisateur à l'inscription.
    Le mot de passe est écrit uniquement (write_only) : il n'apparaît jamais dans les réponses JSON.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={"input_type": "password"},
    )

    # Rôle choisi à l'inscription (enseignant/élève). On valide qu'il fait bien partie
    # des choix autorisés par le modèle (voir User.ROLES).
    role = serializers.ChoiceField(choices=User.ROLES, default="enseignant")

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "password", "role"]

    def create(self, validated_data):
        """Crée l'utilisateur en hachant correctement le mot de passe (via create_user)."""
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            password=validated_data["password"],
            role=validated_data.get("role", "enseignant"),
        )


class UserProfileSerializer(serializers.ModelSerializer):
    """Représente les informations "publiques" du profil (utilisé pour /me et /users/me).
    Le rôle est affiché mais n'est volontairement PAS modifiable ici (voir
    UpdateProfileSerializer) : changer de rôle après inscription n'est pas prévu
    par le cahier des charges et éviterait toute confusion sur les droits d'accès."""

    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "role", "role_display", "date_joined"]
        read_only_fields = ["id", "role", "date_joined"]


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Sérialiseur utilisé pour la modification du nom/email dans les Paramètres."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email"]


class DeleteAccountSerializer(serializers.Serializer):
    """
    Valide la confirmation de suppression de compte.
    L'utilisateur doit taper exactement "SUPPRIMER" pour confirmer (sécurité anti-erreur).
    """

    confirmation = serializers.CharField()

    def validate_confirmation(self, value):
        if value.strip().upper() != "SUPPRIMER":
            raise serializers.ValidationError('Veuillez taper exactement "SUPPRIMER" pour confirmer.')
        return value
