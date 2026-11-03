"""
config/wsgi.py
---------------
Point d'entrée WSGI, utilisé par les serveurs de production classiques
(gunicorn, uwsgi...). Généré automatiquement par Django, à ne pas modifier.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# L'objet application est utilisé par Gunicorn, uWSGI ou un autre serveur WSGI.
application = get_wsgi_application()
