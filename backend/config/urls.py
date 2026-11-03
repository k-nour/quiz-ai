"""
config/urls.py
---------------
Fichier de routage principal du projet Django.
Il inclut les urls.py de chaque application (users, courses, quizzes, ai)
sous des préfixes différents, et expose l'admin Django + la doc Swagger.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Interface d'administration Django (supervision rapide des données)
    path("admin/", admin.site.urls),

    # Authentification & utilisateurs : /api/auth/... et /api/users/...
    path("api/", include("users.urls")),

    # Ressource principale : les cours
    path("api/courses/", include("courses.urls")),

    # Quiz générés à partir des cours
    path("api/quizzes/", include("quizzes.urls")),

    # Intégration IA (Ollama)
    path("api/ai/", include("ai.urls")),

    # Documentation API interactive (Swagger)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
