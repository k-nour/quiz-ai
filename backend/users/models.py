"""
users/models.py
----------------
Définit le modèle Utilisateur de l'application.
On hérite de AbstractUser (fourni par Django) plutôt que de recréer un système
d'authentification : cela nous donne gratuitement le hachage sécurisé des mots
de passe (PBKDF2), la gestion des permissions, etc.
On utilise l'email comme identifiant de connexion plutôt que le "username".
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Utilisateur de l'application : soit un enseignant, soit un élève.
    Hérite de tous les champs standards de Django (password, is_active, ...)
    et ajoute la connexion par email ainsi qu'un rôle (enseignant/élève).
    """

    ROLES = [
        ("enseignant", "Enseignant"),
        ("eleve", "Élève"),
    ]

    # On rend l'email unique et on l'utilise comme identifiant de connexion
    email = models.EmailField("adresse email", unique=True)

    # Rôle choisi à l'inscription : détermine ce que l'utilisateur peut faire
    # (un enseignant crée des cours/quiz, un élève les consulte).
    role = models.CharField("rôle", max_length=20, choices=ROLES, default="enseignant")

    USERNAME_FIELD = "email"       # champ utilisé pour se connecter
    REQUIRED_FIELDS = ["username"]  # champs requis en plus lors de la création (createsuperuser)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email}) - {self.get_role_display()}".strip()
