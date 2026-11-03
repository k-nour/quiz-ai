"""
ai/services.py
---------------
Contient toute la logique d'appel au LLM local Ollama.
Isolé dans ce fichier "services" pour ne pas mélanger la logique métier IA
avec la vue Django (views.py) : c'est plus facile à tester et à réutiliser.
"""

import json

import requests
from django.conf import settings


def build_quiz_prompt(course_content: str, nb_qcm: int, nb_vrai_faux: int, nb_ouvertes: int, difficulty: str) -> str:
    """
    Construit le prompt envoyé à l'IA pour générer un quiz pédagogique structuré.
    On demande explicitement une réponse au format JSON afin de pouvoir l'afficher
    et l'enregistrer facilement côté front-end.
    """
    return f"""Tu es un assistant pédagogique expert. À partir du COURS ci-dessous, génère un quiz
de niveau de difficulté "{difficulty}", composé exactement de :
- {nb_qcm} question(s) de type QCM (avec 4 propositions dont une seule correcte, propositions plausibles)
- {nb_vrai_faux} question(s) de type Vrai/Faux (avec une courte explication de la réponse)
- {nb_ouvertes} question(s) ouverte(s) (sans propositions, avec une réponse attendue indicative)

IMPORTANT — LANGUE : rédige l'intégralité du quiz (titre, questions, propositions, réponses,
explications) dans LA MÊME LANGUE que le texte du COURS ci-dessous. Si le cours est en français,
réponds en français. S'il est en anglais, réponds en anglais. S'il est en arabe, réponds en arabe.
Ne traduis jamais le contenu dans une autre langue.

IMPORTANT — CONTENU : le tableau "questions" ne doit JAMAIS être vide. Il doit contenir
EXACTEMENT {nb_qcm + nb_vrai_faux + nb_ouvertes} question(s) au total, correspondant précisément
aux quantités demandées ci-dessus pour chaque type. Chaque question doit porter sur un élément
concret du COURS fourni (ne génère pas de questions génériques sans lien avec le texte).

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après, au format exact suivant :
{{
  "title": "Titre du quiz",
  "questions": [
    {{"type": "qcm", "text": "...", "choices": ["...", "...", "...", "..."], "correct_answer": "...", "explanation": ""}},
    {{"type": "vrai_faux", "text": "...", "choices": [], "correct_answer": "vrai", "explanation": "..."}},
    {{"type": "ouverte", "text": "...", "choices": [], "correct_answer": "...", "explanation": ""}}
  ]
}}

COURS :
\"\"\"{course_content}\"\"\"
"""


def stream_ollama_generation(prompt: str):
    """
    Générateur Python qui appelle Ollama en streaming et "yield" les morceaux de texte
    au fur et à mesure qu'ils arrivent, pour un affichage progressif côté front-end.

    Lève une exception explicite si Ollama n'est pas joignable (ex: pas lancé),
    afin que la vue puisse renvoyer un message d'erreur clair.
    """
    url = f"{settings.OLLAMA_URL}/api/generate"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        # Force Ollama à ne renvoyer QUE du JSON valide (supporté par la plupart des
        # modèles récents : llama3, mistral...). Sans ça, le modèle a tendance à
        # ajouter du texte de présentation avant/après le JSON, ce qui casse le parsing.
        "format": "json",
        "options": {
            # Une température basse rend le modèle plus rigoureux/déterministe pour
            # suivre des consignes structurées (moins de "créativité", plus de fiabilité).
            "temperature": 0.3,
            # Empêche la réponse d'être coupée avant la fin du JSON pour les quiz
            # comportant beaucoup de questions (la valeur par défaut d'Ollama est parfois
            # trop basse, ce qui peut produire un JSON tronqué ou un tableau vide).
            "num_predict": 4096,
        },
    }

    try:
        with requests.post(url, json=payload, stream=True, timeout=360) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line:
                    continue
                # Chaque ligne renvoyée par Ollama est un objet JSON du type {"response": "...", "done": false}
                chunk = json.loads(line.decode("utf-8"))
                if "response" in chunk:
                    yield chunk["response"]
                if chunk.get("done"):
                    break
    except requests.exceptions.ConnectionError as exc:
        raise ConnectionError(
            "Impossible de contacter Ollama. Vérifiez qu'il est bien lancé "
            "(commande : `ollama run llama3`) et accessible à l'adresse "
            f"{settings.OLLAMA_URL}."
        ) from exc
    except requests.exceptions.Timeout as exc:
        raise TimeoutError("Ollama met trop de temps à répondre (timeout dépassé).") from exc
