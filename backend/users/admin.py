"""
users/admin.py
---------------
Enregistre le modèle User dans l'interface d'administration Django (/admin)
afin de pouvoir superviser rapidement les comptes utilisateurs.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

admin.site.register(User, UserAdmin)
