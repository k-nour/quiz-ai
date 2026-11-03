"""
courses/views.py
-----------------
Vue CRUD complète pour les cours, grâce à un ModelViewSet DRF qui fournit
automatiquement : list (GET), create (POST), retrieve (GET /id), update (PUT/PATCH),
destroy (DELETE). On y ajoute la recherche, le filtre et le tri.
"""

import io

import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course
from .permissions import IsTeacherOrReadOnly
from .serializers import CourseSerializer


class CourseFilterSet(django_filters.FilterSet):
    """Filtre personnalisé : la matière se filtre en 'contient, insensible à la casse'
    (ex : taper 'python' retrouve un cours dont la matière est 'Python avancé'),
    tandis que le niveau reste une correspondance exacte (liste fermée de valeurs)."""

    subject = django_filters.CharFilter(field_name="subject", lookup_expr="icontains")

    class Meta:
        model = Course
        fields = ["subject", "level"]


class CourseViewSet(viewsets.ModelViewSet):
    """
    CRUD complet des cours.
    - Un ENSEIGNANT ne voit et ne modifie que SES PROPRES cours (isolation des données),
      et peut créer/éditer/supprimer.
    - Un ÉLÈVE voit TOUS les cours (catalogue de consultation) mais en lecture seule.
    - Recherche texte sur titre/contenu : ?search=...
    - Filtre par matière/niveau : ?subject=...&level=...
    - Tri : ?ordering=title ou ?ordering=-created_at
    """

    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourseFilterSet
    search_fields = ["title", "content"]
    ordering_fields = ["created_at", "updated_at", "title"]

    def get_queryset(self):
        """Un enseignant ne voit que ses cours ; un élève voit le catalogue complet."""
        user = self.request.user
        if user.role == "enseignant":
            return Course.objects.filter(author=user)
        return Course.objects.all()

    def perform_create(self, serializer):
        """À la création, associe automatiquement le cours à l'utilisateur connecté."""
        serializer.save(author=self.request.user)


class ImportCourseFileView(APIView):
    """
    POST /api/courses/import-file/
    Extrait le texte d'un fichier .txt ou .pdf envoyé par l'enseignant, afin de
    préremplir le champ "contenu" du formulaire de création de cours, sans que
    l'enseignant ait à copier-coller manuellement le texte.
    Réservé aux enseignants (mêmes droits que la création de cours).
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"error": "Aucun fichier reçu."}, status=status.HTTP_400_BAD_REQUEST)

        filename = uploaded_file.name.lower()

        try:
            if filename.endswith(".txt"):
                content = uploaded_file.read().decode("utf-8", errors="ignore")
            elif filename.endswith(".pdf"):
                content = self._extract_pdf_text(uploaded_file)
            else:
                return Response(
                    {"error": "Format non supporté. Utilisez un fichier .txt ou .pdf."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception:
            return Response(
                {"error": "Impossible de lire le contenu de ce fichier. Vérifiez qu'il n'est pas corrompu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = content.strip()
        if not content:
            return Response(
                {"error": "Aucun texte n'a pu être extrait de ce fichier."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"content": content}, status=status.HTTP_200_OK)

    def _extract_pdf_text(self, uploaded_file):
        """Extrait le texte de toutes les pages d'un PDF grâce à la bibliothèque pypdf."""
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(uploaded_file.read()))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages_text)
