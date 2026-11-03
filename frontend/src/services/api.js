/**
 * services/api.js
 * ----------------
 * Centralise TOUS les appels HTTP vers le back-end Django.
 * Règle du projet : aucun composant React n'appelle fetch() directement,
 * tout passe par ce fichier. Cela évite la duplication et facilite la maintenance
 * (ex : changer l'URL de l'API se fait à un seul endroit).
 *
 * Si VITE_USE_MOCK=true, on utilise des données fictives (mockData.js) au lieu
 * du vrai back-end, pour pouvoir développer/tester le front sans backend lancé.
 */

import * as mock from "./mockData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/** Récupère le token JWT stocké après connexion. */
function getAccessToken() {
  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

/**
 * Fonction bas niveau qui effectue une requête fetch() vers l'API,
 * ajoute automatiquement le header d'authentification JWT si présent,
 * et gère les erreurs de façon homogène.
 */
async function request(path, { method = "GET", body, isFormData = false, raw = false } = {}) {
  // FormData définit lui-même son Content-Type avec la bonne boundary multipart.
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";

  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  // Les téléchargements et le streaming doivent rester des réponses brutes.
  if (raw) return response; // pour le streaming (génération IA) ou les fichiers binaires

  if (!response.ok) {
    let message = "Une erreur est survenue.";
    try {
      const data = await response.json();
      message = data.error || JSON.stringify(data.details || data);
    } catch {
      // pas de JSON dans la réponse, on garde le message générique
    }
    throw new Error(message);
  }

  if (response.status === 204) return null; // pas de contenu (ex: DELETE réussi)
  // Toutes les réponses JSON sont converties ici afin que les pages restent simples.
  return response.json();
}

// ------------------- AUTHENTIFICATION -------------------

export async function registerUser({ username, email, password, first_name, last_name, role }) {
  if (USE_MOCK) return mock.mockRegister(role);
  return request("/auth/register", {
    method: "POST",
    body: { username, email, password, first_name, last_name, role },
  });
}

export async function loginUser({ email, password }) {
  if (USE_MOCK) return mock.mockLogin();
  return request("/auth/login", { method: "POST", body: { email, password } });
}

export async function logoutUser() {
  if (USE_MOCK) return { message: "Déconnecté (mode démo)" };
  return request("/auth/logout", { method: "POST", body: { refresh: getRefreshToken() } });
}

export async function fetchMe() {
  if (USE_MOCK) return mock.mockUser;
  return request("/auth/me");
}

// ------------------- PROFIL / PARAMÈTRES -------------------

export async function updateProfile(data) {
  if (USE_MOCK) return { ...mock.mockUser, ...data };
  return request("/users/me", { method: "PATCH", body: data });
}

export async function exportMyData() {
  if (USE_MOCK) return mock.mockExport;
  const response = await request("/users/me/export", { raw: true });
  return response.blob();
}

export async function deleteAccount(confirmation) {
  if (USE_MOCK) return { message: "Compte supprimé (mode démo)" };
  return request("/users/me/delete", { method: "POST", body: { confirmation } });
}

// ------------------- COURS -------------------

export async function fetchCourses({ search = "", subject = "", level = "", ordering = "-created_at" } = {}) {
  if (USE_MOCK) return mock.mockCourses;
  const params = new URLSearchParams({ search, subject, level, ordering });
  return request(`/courses/?${params.toString()}`);
}

export async function fetchCourse(id) {
  if (USE_MOCK) return mock.mockCourses.results.find((c) => c.id === Number(id));
  return request(`/courses/${id}/`);
}

export async function createCourse(data) {
  if (USE_MOCK) return { id: Date.now(), ...data };
  return request("/courses/", { method: "POST", body: data });
}

export async function updateCourse(id, data) {
  if (USE_MOCK) return { id, ...data };
  return request(`/courses/${id}/`, { method: "PATCH", body: data });
}

export async function deleteCourse(id) {
  if (USE_MOCK) return null;
  return request(`/courses/${id}/`, { method: "DELETE" });
}

/**
 * Envoie un fichier (.txt ou .pdf) au back-end pour en extraire le texte,
 * afin de préremplir le champ "contenu" du formulaire de cours.
 * Non disponible en mode démo (pas de traitement PDF côté front).
 */
export async function importCourseFile(file) {
  if (USE_MOCK) {
    throw new Error(
      "L'import de fichier n'est pas disponible en mode démo (VITE_USE_MOCK=true). Lancez le backend pour tester cette fonctionnalité."
    );
  }
  const formData = new FormData();
  formData.append("file", file);
  return request("/courses/import-file/", { method: "POST", body: formData, isFormData: true });
}

// ------------------- QUIZ -------------------

export async function fetchQuizzes() {
  if (USE_MOCK) return mock.mockQuizzes;
  return request("/quizzes/");
}

export async function fetchQuiz(id) {
  if (USE_MOCK) return mock.mockQuizzes.results.find((q) => q.id === Number(id));
  return request(`/quizzes/${id}/`);
}

export async function saveQuiz(data) {
  if (USE_MOCK) return { id: Date.now(), ...data };
  return request("/quizzes/", { method: "POST", body: data });
}

export async function validateQuiz(id, validated) {
  if (USE_MOCK) return { id, validated };
  return request(`/quizzes/${id}/validate/`, { method: "POST", body: { validated } });
}

export async function deleteQuiz(id) {
  if (USE_MOCK) return null;
  return request(`/quizzes/${id}/`, { method: "DELETE" });
}

export function exportQuizUrl(id, format = "json") {
  return `${API_URL}/quizzes/${id}/export/?format=${format}`;
}

// ------------------- IA (génération de quiz via Ollama) -------------------

/**
 * Lance la génération IA en streaming.
 * `onChunk` est appelé à chaque morceau de texte reçu (effet "machine à écrire").
 * Retourne le texte complet une fois la génération terminée.
 */
export async function generateQuizWithAI({ content, nb_qcm, nb_vrai_faux, nb_ouvertes, difficulty }, onChunk) {
  if (USE_MOCK) return mock.mockGenerateStream(onChunk);

  const response = await request("/ai/generate", {
    method: "POST",
    raw: true,
    body: { content, nb_qcm, nb_vrai_faux, nb_ouvertes, difficulty },
  });

  if (!response.ok) {
    throw new Error("Impossible de contacter le service de génération IA.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunkText = decoder.decode(value, { stream: true });

    // Le backend préfixe les erreurs IA (ex: Ollama non lancé) avec [[ERREUR_IA]]
    if (chunkText.includes("[[ERREUR_IA]]")) {
      const [, errorJson] = chunkText.split("[[ERREUR_IA]]");
      const { error } = JSON.parse(errorJson);
      throw new Error(error);
    }

    fullText += chunkText;
    onChunk(chunkText, fullText);
  }

  return fullText;
}
