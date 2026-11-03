"""
config/settings.py
-------------------
Fichier de configuration central du projet Django.
Il déclare :
- les applications installées (dont nos 3 apps métier : users, courses, quizzes, ai)
- la configuration de la base de données (SQLite)
- la configuration de Django REST Framework (DRF) et de l'authentification JWT
- la configuration CORS (pour autoriser le front-end React à appeler l'API)
- les variables sensibles lues depuis le fichier .env (jamais en dur dans le code)
"""

from datetime import timedelta
from pathlib import Path

import environ

# BASE_DIR pointe vers le dossier racine "backend/"
BASE_DIR = Path(__file__).resolve().parent.parent

# ---- Lecture des variables d'environnement (.env) ----
env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="dev-secret-key-non-securisee")
DEBUG = env.bool("DEBUG", default=True)

ALLOWED_HOSTS = ["*"]  # simplifié pour un usage pédagogique/démo

# ---- Applications installées ----
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Librairies tierces
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    "django_filters",
    # Nos applications métier
    "users",
    "courses",
    "quizzes",
    "ai",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # doit être placé avant CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    # CSRF est désactivé pour les endpoints API JWT (voir REST_FRAMEWORK plus bas),
    # mais on garde le middleware actif pour les autres usages (ex: admin Django).
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---- Base de données : SQLite (fichier local, aucun serveur à installer) ----
(BASE_DIR / "db").mkdir(exist_ok=True)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db" / "db.sqlite3",
    }
}

# ---- Modèle utilisateur personnalisé (voir users/models.py) ----
AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---- Django REST Framework ----
REST_FRAMEWORK = {
    # Toutes les vues sont protégées par défaut : il faut être authentifié (JWT)
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    # Gestion centralisée des erreurs pour renvoyer un JSON clair et homogène
    "EXCEPTION_HANDLER": "config.exceptions.custom_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    # DRF utilise par défaut le paramètre "?format=" pour choisir le renderer.
    # Comme notre export utilise aussi "?format=csv|pdf", DRF renvoyait une 404.
    # On désactive ce comportement pour garder notre paramètre.
    "URL_FORMAT_OVERRIDE": None,
}

# ---- Configuration JWT (djangorestframework-simplejwt) ----
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,  # le refresh token est blacklisté à la déconnexion
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ---- CORS : seul le front-end défini dans .env peut appeler l'API ----
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS", default=["http://localhost:5173", "http://127.0.0.1:5173"]
)
CORS_ALLOW_CREDENTIALS = True

# ---- Documentation API (Swagger via drf-spectacular) ----
SPECTACULAR_SETTINGS = {
    "TITLE": "EduQuizAI API",
    "DESCRIPTION": "API du générateur intelligent de quiz pédagogiques EduQuizAI by SchoolUp.",
    "VERSION": "1.0.0",
}

# ---- Configuration Ollama (module IA, voir ai/services.py) ----
OLLAMA_URL = env("OLLAMA_URL", default="http://localhost:11434")
OLLAMA_MODEL = env("OLLAMA_MODEL", default="llama3")
