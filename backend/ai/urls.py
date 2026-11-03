"""
ai/urls.py
-----------
Route de l'endpoint de génération IA.
"""

import django.urls  # type: ignore

from .views import GenerateQuizView

# La vue vérifie ensuite l'authentification et le rôle enseignant.
urlpatterns = [
    django.urls.path("generate", GenerateQuizView.as_view(), name="ai-generate"),
]
