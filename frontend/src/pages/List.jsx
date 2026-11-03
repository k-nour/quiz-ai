/**
 * pages/List.jsx
 * ---------------
 * Page générique de liste, utilisée pour /cours ET /quiz (prop `resource`).
 * - Pour les cours : recherche texte, filtre matière/niveau, tri, suppression avec modal.
 * - Pour les quiz : liste des quiz générés, validation manuelle, export, suppression.
 * Toute la logique de filtrage se fait ici ; les appels réseau restent dans services/api.js.
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchCourses,
  deleteCourse,
  fetchQuizzes,
  deleteQuiz,
  validateQuiz,
  exportQuizUrl,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, Button, Badge, Modal, Alert, Spinner, EmptyState } from "../components/ui";

const NIVEAUX = [
  { value: "", label: "Tous les niveaux" },
  { value: "primaire", label: "Primaire" },
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
  { value: "superieur", label: "Enseignement supérieur" },
];

export default function List({ resource }) {
  const { user } = useAuth();
  const isTeacher = user?.role === "enseignant";
  const isCourses = resource === "cours";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtres (utilisés uniquement pour les cours)
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState(searchParams.get("matiere") || "");
  const [level, setLevel] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  const [deleteTarget, setDeleteTarget] = useState(null); // élément en attente de confirmation

  async function load() {
    // La même fonction alimente les deux écrans, avec des filtres uniquement pour les cours.
    setLoading(true);
    setError("");
    try {
      if (isCourses) {
        const data = await fetchCourses({ search, subject, level, ordering });
        setItems(data.results || []);
      } else {
        const data = await fetchQuizzes();
        setItems(data.results || []);
      }
    } catch (err) {
      setError(err.message || "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCourses]);

  // Re-filtre côté cours dès que la recherche/le tri change (avec un léger débounce)
  useEffect(() => {
    if (!isCourses) return;
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, subject, level, ordering]);

  async function confirmDelete() {
    // Après confirmation, retire localement l'élément pour actualiser l'affichage.
    if (!deleteTarget) return;
    try {
      if (isCourses) await deleteCourse(deleteTarget.id);
      else await deleteQuiz(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } catch (err) {
      setError(err.message || "La suppression a échoué.");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function toggleValidation(quiz) {
    // Inverse le statut puis remplace le quiz mis à jour dans la liste.
    try {
      const updated = await validateQuiz(quiz.id, !quiz.validated);
      setItems((prev) => prev.map((q) => (q.id === quiz.id ? { ...q, validated: updated.validated } : q)));
    } catch (err) {
      setError(err.message || "Impossible de mettre à jour la validation.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-app-text">
          {isCourses ? (isTeacher ? "Mes cours" : "Cours") : isTeacher ? "Mes quiz" : "Quiz"}
        </h1>
        {isCourses && isTeacher && (
          <Link to="/cours/nouveau">
            <Button variant="accent">+ Créer un cours</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {isCourses && (
        <Card className="mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              placeholder="Rechercher un cours..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
              aria-label="Rechercher un cours"
            />
            <input
              type="text"
              placeholder="Filtrer par matière..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border rounded-lg px-3 py-2 sm:w-48"
              aria-label="Filtrer par matière"
            />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="border rounded-lg px-3 py-2"
              aria-label="Filtrer par niveau"
            >
              {NIVEAUX.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="border rounded-lg px-3 py-2"
              aria-label="Trier"
            >
              <option value="-created_at">Plus récents d'abord</option>
              <option value="created_at">Plus anciens d'abord</option>
              <option value="title">Titre (A → Z)</option>
            </select>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            title={isCourses ? "Aucun cours trouvé" : "Aucun quiz généré"}
            description={
              isCourses
                ? "Créez un cours pour commencer à générer des quiz."
                : "Générez un quiz depuis la page d'un cours."
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) =>
            isCourses ? (
              <CourseRow key={item.id} course={item} isTeacher={isTeacher} onDelete={() => setDeleteTarget(item)} />
            ) : (
              <QuizRow
                key={item.id}
                quiz={item}
                isTeacher={isTeacher}
                onDelete={() => setDeleteTarget(item)}
                onToggleValidation={() => toggleValidation(item)}
              />
            )
          )}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Supprimer "${deleteTarget?.title || ""}" ?`}
      >
        <p className="text-sm text-app-text/70 mb-4">
          Cette action est irréversible. {isCourses && "Les quiz liés à ce cours seront également supprimés."}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button variant="danger" onClick={confirmDelete}>Supprimer définitivement</Button>
        </div>
      </Modal>
    </div>
  );
}

/** Ligne d'affichage d'un cours dans la liste. */
function CourseRow({ course, isTeacher, onDelete }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-semibold">{course.title}</p>
        <p className="text-xs text-app-text/50 mt-1">
          {course.subject || "Sans matière"} · {course.level || "Niveau non précisé"} ·{" "}
          {new Date(course.created_at).toLocaleDateString("fr-FR")}
          {!isTeacher && course.author_name && <> · par {course.author_name}</>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge color={course.quiz_count > 0 ? "secondary" : "primary"}>
          {course.quiz_count > 0 ? `${course.quiz_count} quiz` : "Sans quiz"}
        </Badge>
        {isTeacher ? (
          <>
            <Link to={`/cours/${course.id}/generer-ia`}>
              <Button variant="accent">✨ Générer</Button>
            </Link>
            <Link to={`/cours/${course.id}/editer`}>
              <Button variant="ghost">Éditer</Button>
            </Link>
            <Button variant="danger" onClick={onDelete}>Supprimer</Button>
          </>
        ) : (
          <Link to={`/cours/${course.id}/editer`}>
            <Button variant="ghost">Consulter</Button>
          </Link>
        )}
      </div>
    </Card>
  );
}

/** Ligne d'affichage d'un quiz dans la liste. */
function QuizRow({ quiz, isTeacher, onDelete, onToggleValidation }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-semibold">{quiz.title}</p>
        <p className="text-xs text-app-text/50 mt-1">
          {quiz.course_title} · {quiz.questions?.length || 0} questions ·{" "}
          {new Date(quiz.created_at).toLocaleDateString("fr-FR")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge color={quiz.validated ? "secondary" : "accent"}>
          {quiz.validated ? "Validé" : "En attente de validation"}
        </Badge>
        {isTeacher && (
          <Button variant="ghost" onClick={onToggleValidation}>
            {quiz.validated ? "Invalider" : "Valider"}
          </Button>
        )}
        <a href={exportQuizUrl(quiz.id, "pdf")} target="_blank" rel="noreferrer">
          <Button variant="ghost">Export PDF</Button>
        </a>
        <a href={exportQuizUrl(quiz.id, "csv")} target="_blank" rel="noreferrer">
          <Button variant="ghost">Export CSV</Button>
        </a>
        {isTeacher && (
          <Button variant="danger" onClick={onDelete}>Supprimer</Button>
        )}
      </div>
    </Card>
  );
}
