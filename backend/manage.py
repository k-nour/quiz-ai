#!/usr/bin/env python
"""
manage.py
----------
Point d'entrée des commandes Django (migrate, runserver, createsuperuser, etc.).
C'est un fichier généré automatiquement par Django, on ne le modifie presque jamais.
Utilisation : python manage.py <commande>
"""
import os
import sys


def main():
    """Lance la commande Django demandée en ligne de commande."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Impossible d'importer Django. Vérifiez qu'il est bien installé "
            "et que votre environnement virtuel est activé."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
