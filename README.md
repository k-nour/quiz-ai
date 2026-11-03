# EduQuizAI by SchoolUp

Générateur intelligent de quiz pédagogiques pour enseignants, à partir de leurs
cours/textes, en s'appuyant sur une IA générative locale (Ollama).

Projet réalisé dans le cadre du CD2IA 2025/2026 — Metz Numeric School (SchoolUp, start-up fictive).

## Stack technique

| Couche | Technologie |
|---|---|
| Front-end | React 18 + Vite + TailwindCSS |
| Back-end | Python 3.11 + Django + Django REST Framework |
| Base de données | SQLite + Django ORM |
| IA générative | Ollama (LLM local, ex : llama3 ou mistral) |
| Auth | JWT (djangorestframework-simplejwt) |
| Déploiement | Docker + Docker Compose |

## Fonctionnalités

- **Authentification** : inscription (avec choix du rôle **Enseignant** ou **Élève**), connexion,
  déconnexion (JWT), routes protégées front & back.
- **Rôles et droits** :
  - Un **enseignant** crée, édite, supprime ses propres cours et quiz, importe des fichiers,
    et génère des quiz par IA.
  - Un **élève** consulte en lecture seule le catalogue de tous les cours et les quiz déjà
    validés par les enseignants (aucun droit de création/modification/suppression).
- **Cours** : création, édition, suppression, recherche/filtre/tri (matière, niveau scolaire),
  **import de fichier** (.txt ou .pdf) pour préremplir automatiquement le contenu du cours.
- **Quiz IA** : génération d'un quiz (QCM, Vrai/Faux, questions ouvertes) à partir du contenu
  d'un cours, avec mix de questions et difficulté configurables, affichage en streaming,
  et **vérification humaine obligatoire avant sauvegarde définitive**.
- **Export** : quiz exportables en JSON, CSV et PDF.
- **Tableau de bord** : cours créés, quiz générés, questions générées, taux de validation.
- **Paramètres** : édition du profil, export RGPD des données (JSON), suppression de compte
  (confirmation en tapant "SUPPRIMER").
- **Mode démo** : `VITE_USE_MOCK=true` permet de tester tout le front sans backend ni IA
  (l'import de fichier PDF n'est pas disponible en mode démo, car il nécessite le backend).

---

## 🚀 Lancement

### Mode démo (sans rien installer sauf Node.js)

Aucun backend, aucune IA nécessaire — utilise des données fictives (`mockData.js`).

```bash
cd frontend
npm install
cp .env.example .env
# Dans .env, mettre VITE_USE_MOCK=true
npm run dev
```
Ouvrez http://localhost:5173

### Avec Docker (tout en un : front + back)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```
- Front → http://localhost:5173
- Back → http://localhost:8000
- Admin Django → http://localhost:8000/admin
- Docs API (Swagger) → http://localhost:8000/api/docs

### Back-end Python seul (sans Docker)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

### Front-end seul (sans Docker)

```bash
cd frontend
npm install
cp .env.example .env
# Vérifier que VITE_USE_MOCK=false et VITE_API_URL pointe vers le backend
npm run dev
```

### Ollama (IA locale)

L'application appelle Ollama pour générer les quiz. Sans Ollama lancé, l'app
reste utilisable mais affichera un message d'erreur clair au moment de la génération IA.

```bash
# 1. Télécharger Ollama : https://ollama.com
# 2. Lancer un modèle
ollama run llama3
# ou
ollama run mistral
# 3. Ollama écoute sur http://localhost:11434
```

---

## Structure du projet

```
eduquizai/
├── docker-compose.yml
├── backend/            # API Django REST Framework
│   ├── config/          # réglages globaux, urls, JWT, CORS
│   ├── users/            # inscription, connexion, profil, RGPD
│   ├── courses/           # CRUD des cours
│   ├── quizzes/            # CRUD des quiz + export PDF/CSV/JSON
│   └── ai/                  # intégration Ollama (génération streaming)
└── frontend/            # Application React + Vite + Tailwind
    └── src/
        ├── context/       # AuthContext (gestion JWT globale)
        ├── services/       # api.js (tous les appels réseau) + mockData.js
        ├── hooks/           # useApi (loading/error/data générique)
        ├── components/       # ui/ (Button, Card, Modal...) + layout/ (Sidebar, AppLayout)
        └── pages/             # Login, Dashboard, List, Form, AiGenerate, Settings
```

## Comptes de test

Aucun compte n'est préchargé : créez le vôtre via la page d'inscription, ou
créez un superutilisateur Django avec `python manage.py createsuperuser` pour
accéder à `/admin`.

## Sécurité & bonnes pratiques appliquées

- Mots de passe hachés automatiquement par Django (PBKDF2).
- JWT vérifié sur toutes les vues privées (`IsAuthenticated`).
- CORS restreint à l'origine du front-end.
- Aucune valeur sensible en dur : tout passe par `.env` (front et back).
- Chaque cours/quiz n'est visible que par son auteur (isolation des données par enseignant).
