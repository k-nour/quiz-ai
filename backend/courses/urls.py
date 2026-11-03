"""
courses/urls.py
----------------
Déclare les routes CRUD des cours via un DefaultRouter DRF, qui génère
automatiquement :
GET    /api/courses/          -> liste
POST   /api/courses/          -> création
GET    /api/courses/{id}/     -> détail
PUT    /api/courses/{id}/     -> édition complète
PATCH  /api/courses/{id}/     -> édition partielle
DELETE /api/courses/{id}/     -> suppression
"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CourseViewSet, ImportCourseFileView

router = DefaultRouter()
router.register(r"", CourseViewSet, basename="course")

urlpatterns = [
    # Route explicite placée AVANT les routes du router : sinon "import-file/"
    # serait interprété comme un {id} de cours par le DefaultRouter.
    path("import-file/", ImportCourseFileView.as_view(), name="course-import-file"),
] + router.urls
