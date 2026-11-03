"""
courses/permissions.py
------------------------
Permission DRF personnalisée liée au rôle de l'utilisateur.

Règle métier : un ÉLÈVE peut uniquement consulter (lecture seule) les cours et
quiz — il ne peut ni créer, ni modifier, ni supprimer. Un ENSEIGNANT a tous les
droits sur SES PROPRES cours/quiz (l'isolation par auteur est gérée séparément
dans get_queryset() de chaque vue).
"""

from rest_framework import permissions


class IsTeacherOrReadOnly(permissions.BasePermission):
    """Autorise la lecture (GET) à tout utilisateur authentifié, mais réserve
    les actions d'écriture (POST/PUT/PATCH/DELETE) aux utilisateurs ayant le
    rôle 'enseignant'."""

    message = "Seuls les enseignants peuvent créer, modifier ou supprimer cet élément."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == "enseignant")
