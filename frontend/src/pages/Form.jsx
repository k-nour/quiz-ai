/**
 * pages/Form.jsx
 * ---------------
 * Formulaire de création OU d'édition d'un cours (prop `mode` = "create" | "edit").
 * Contient une validation côté front (champs requis, longueur minimale) ; la
 * validation définitive reste toutefois faite côté back-end (serializers DRF).
 *
 * Réservé aux enseignants : un élève qui ouvre cette page (ex : via "Consulter"
 * depuis la liste des cours) voit le contenu en LECTURE SEULE, sans pouvoir
 * modifier ni importer de fichier.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCourse, createCourse, updateCourse, importCourseFile } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, Button, Alert, Spinner } from "../components/ui";

const NIVEAUX = [
  { value: "", label: "Sélectionner un niveau" },
  { value: "primaire", label: "Primaire" },
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
  { value: "superieur", label: "Enseignement supérieur" },
];

const EMPTY_FORM = { title: "", content: "", subject: "", level: "" };

export default function Form({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isTeacher = user?.role === "enseignant";
  const isEdit = mode === "edit";
  // Un élève ne peut jamais éditer : la page devient une simple consultation.
  const readOnly = !isTeacher;

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  // En mode édition, on charge d'abord le cours existant.
  useEffect(() => {
    if (!isEdit) return;
    fetchCourse(id)
      .then((course) => setForm({
        title: course.title,
        content: course.content,
        subject: course.subject || "",
        level: course.level || "",
      }))
      .catch((err) => setError(err.message || "Impossible de charger ce cours."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!form.title.trim()) return "Le titre est obligatoire.";
    if (form.title.trim().length < 3) return "Le titre doit contenir au moins 3 caractères.";
    if (!form.content.trim()) return "Le contenu du cours est obligatoire.";
    if (form.content.trim().length < 20) return "Le contenu doit contenir au moins 20 caractères.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCourse(id, form);
      } else {
        await createCourse(form);
      }
      setSaved(true);
      setTimeout(() => navigate("/cours"), 700);
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer le cours.");
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Gère l'import d'un fichier .txt ou .pdf pour préremplir le contenu du cours.
   * - .txt : lu directement dans le navigateur (FileReader), pas besoin du backend.
   * - .pdf : envoyé au backend qui extrait le texte (voir services/api.js).
   */
  async function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");

    const isTxt = file.name.toLowerCase().endsWith(".txt");
    const isPdf = file.name.toLowerCase().endsWith(".pdf");

    if (!isTxt && !isPdf) {
      setImportError("Seuls les fichiers .txt et .pdf sont pris en charge.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImporting(true);
    try {
      if (isTxt) {
        const text = await file.text();
        updateField("content", text);
      } else {
        const { content } = await importCourseFile(file);
        updateField("content", content);
      }
    } catch (err) {
      setImportError(err.message || "Impossible d'importer ce fichier.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-app-text mb-6">
        {readOnly ? "Consulter le cours" : isEdit ? "Éditer le cours" : "Créer un nouveau cours"}
      </h1>

      <Card>
        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}
        {saved && (
          <div className="mb-4">
            <Alert type="success">Cours enregistré avec succès !</Alert>
          </div>
        )}
        {readOnly && (
          <div className="mb-4">
            <Alert type="info">
              Vous consultez ce cours en lecture seule. Seuls les enseignants peuvent le modifier.
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titre du cours *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 disabled:bg-app-bg disabled:text-app-text/60"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
              minLength={3}
              disabled={readOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Matière</label>
              <input
                className="w-full border rounded-lg px-3 py-2 disabled:bg-app-bg disabled:text-app-text/60"
                placeholder="Ex : Histoire, Mathématiques..."
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Niveau scolaire</label>
              <select
                className="w-full border rounded-lg px-3 py-2 disabled:bg-app-bg disabled:text-app-text/60"
                value={form.level}
                onChange={(e) => updateField("level", e.target.value)}
                disabled={readOnly}
              >
                {NIVEAUX.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!readOnly && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Importer un fichier (optionnel)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileImport}
                  disabled={importing}
                  className="text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:text-sm file:cursor-pointer"
                />
                {importing && <span className="text-xs text-app-text/50">Extraction du texte en cours...</span>}
              </div>
              <p className="text-xs text-app-text/50 mt-1">
                Formats acceptés : .txt ou .pdf. Le texte extrait remplace le contenu ci-dessous (vous pouvez ensuite le modifier).
              </p>
              {importError && (
                <div className="mt-2">
                  <Alert type="error">{importError}</Alert>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Contenu du cours *</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 font-mono text-sm disabled:bg-app-bg disabled:text-app-text/60"
              rows={12}
              placeholder="Rédigez ou collez le texte de votre cours ici. C'est ce texte qui servira de base à la génération du quiz par l'IA."
              value={form.content}
              onChange={(e) => updateField("content", e.target.value)}
              required
              minLength={20}
              disabled={readOnly}
            />
            <p className="text-xs text-app-text/50 mt-1">{form.content.trim().length} caractères</p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => navigate("/cours")}>
              {readOnly ? "Retour" : "Annuler"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le cours"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
