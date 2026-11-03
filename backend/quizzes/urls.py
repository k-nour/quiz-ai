"""
quizzes/urls.py
----------------
Routes CRUD des quiz (+ actions validate/export) via un DefaultRouter DRF.
"""

from rest_framework.routers import DefaultRouter

from .views import QuizViewSet

# Le routeur génère les routes de liste et de détail du ViewSet,
# ainsi que les actions personnalisées validate et export.
router = DefaultRouter()
router.register(r"", QuizViewSet, basename="quiz")

urlpatterns = router.urls
