/**
 * pages/Login.jsx
 * -----------------
 * Page de connexion ET d'inscription, présentées sous forme d'onglets.
 * Redirige vers le tableau de bord une fois connecté.
 */

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Alert } from "../components/ui";

export default function Login() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("connexion"); // "connexion" | "inscription"
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "enseignant", // "enseignant" ou "eleve", choisi à l'inscription
  });

  // Si déjà connecté, inutile de rester sur la page de connexion
  if (isAuthenticated) return <Navigate to="/tableau-de-bord" replace />;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateForm() {
    if (!form.email || !form.password) return "L'email et le mot de passe sont requis.";
    if (form.password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (tab === "inscription" && !form.username) return "Le nom d'utilisateur est requis.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      if (tab === "connexion") {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate("/tableau-de-bord");
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">EduQuizAI</h1>
          <p className="text-sm text-app-text/60">by SchoolUp</p>
        </div>

        {/* Onglets connexion / inscription */}
        <div className="flex mb-6 border-b border-app-text/10">
          {["connexion", "inscription"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setError("");
              }}
              className={`flex-1 pb-2 text-sm font-medium capitalize transition-app ${
                tab === t ? "text-primary border-b-2 border-primary" : "text-app-text/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "inscription" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Je m'inscris en tant que *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "enseignant", label: "👩‍🏫 Enseignant", desc: "Crée des cours et génère des quiz" },
                    { value: "eleve", label: "🎓 Élève", desc: "Consulte les cours et répond aux quiz" },
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => updateField("role", option.value)}
                      className={`text-left border rounded-lg px-3 py-2 transition-app ${
                        form.role === option.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-app-text/15 hover:border-app-text/30"
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-app-text/50">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom d'utilisateur *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe * (min. 8 caractères)</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              minLength={8}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Veuillez patienter..." : tab === "connexion" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
