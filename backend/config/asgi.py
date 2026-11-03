"""
config/asgi.py
---------------
Point d'entrée ASGI, utilisé pour les fonctionnalités asynchrones
(utile ici si l'on veut plus tard faire du vrai streaming websocket pour l'IA).
Généré automatiquement par Django, à ne pas modifier.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# L'objet application est utilisé par Uvicorn, Hypercorn ou un autre serveur ASGI.
application = get_asgi_application()
