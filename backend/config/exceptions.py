"""
config/exceptions.py
---------------------
Gestionnaire d'exceptions personnalisé pour Django REST Framework.
Permet de renvoyer systématiquement des erreurs au format JSON clair et homogène,
plutôt que la page HTML d'erreur par défaut de Django.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    Intercepte toutes les exceptions levées dans les vues DRF.
    Retourne un JSON de la forme : {"error": "message lisible", "details": {...}}
    """
    # On laisse d'abord DRF gérer l'exception normalement
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "error": "Une erreur est survenue lors du traitement de votre requête.",
            "details": response.data,
        }
    else:
        # Exception non gérée par DRF (ex: erreur Python inattendue) -> réponse générique 500
        response = Response(
            {"error": "Erreur interne du serveur.", "details": str(exc)},
            status=500,
        )

    return response
