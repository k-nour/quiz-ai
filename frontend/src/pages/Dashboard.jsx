/**
 * pages/Dashboard.jsx
 * --------------------
 * Tableau de bord affiché après connexion. Montre 4 cartes de métriques
 * (cours créés, quiz générés, nombre total de questions, taux de validation),
 * ainsi que la liste des cours les plus récents avec leur statut.
 * Toutes les données viennent de useApi() -> fetchCourses()/fetchQuizzes(),
 * donc aucune duplication d'appel API ici.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { fetchCourses, fetchQuizzes } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card, Badge, Button, Spinner, Alert, EmptyState } from "../components/ui";

/** Petite carte de métrique réutilisée 4 fois dans le tableau de bord. */
function MetricCard({ label, value, icon }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-app-text/60">{label}</p>
          <p className="text-3xl font-bold text-primary mt-1">{value}</p>
        </div>
        <span className="text-3xl" aria-hidden="true">{icon}</span>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isTeacher = user?.role === "enseignant";
  const { data: coursesData, loading: loadingCourses, error: errorCourses } = useApi(fetchCourses);
  const { data: quizzesData, loading: loadingQuizzes, error: errorQuizzes } = useApi(fetchQuizzes);

  const loading = loadingCourses || loadingQuizzes;
  const error = errorCourses || errorQuizzes;

  // Calcul des métriques dérivées à partir des cours et quiz récupérés.
  const metrics = useMemo(() => {
    const courses = coursesData?.results || [];
    const quizzes = quizzesData?.results || [];
    const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);
    const validatedCount = quizzes.filter((q) => q.validated).length;
    const validationRate = quizzes.length > 0 ? Math.round((validatedCount / quizzes.length) * 100) : 0;

    return {
      coursesCount: coursesData?.count ?? courses.length,
      quizzesCount: quizzesData?.count ?? quizzes.length,
      totalQuestions,
      validationRate,
    };
  }, [coursesData, quizzesData]);

  const recentCourses = (coursesData?.results || []).slice(0, 5);

  // Regroupe les cours par matière (ex: Python, Machine Learning, Maths, Anglais...)
  // pour afficher une répartition visuelle sur le tableau de bord.
  const subjectBreakdown = useMemo(() => {
    const courses = coursesData?.results || [];
    const counts = {};
    for (const course of courses) {
      const key = course.subject?.trim() || "Sans matière";
      counts[key] = (counts[key] || 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = entries.length > 0 ? entries[0][1] : 1;
    return entries.map(([subject, count]) => ({ subject, count, percent: Math.round((count / max) * 100) }));
  }, [coursesData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-app-text">Tableau de bord</h1>
          <p className="text-sm text-app-text/60">Vue d'ensemble de votre activité pédagogique.</p>
        </div>
        {isTeacher && (
          <Link to="/cours/nouveau">
            <Button variant="accent">+ Créer un cours</Button>
          </Link>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Cours créés" value={metrics.coursesCount} icon="📚" />
            <MetricCard label="Quiz générés" value={metrics.quizzesCount} icon="📝" />
            <MetricCard label="Questions générées" value={metrics.totalQuestions} icon="❓" />
            <MetricCard label="Taux de validation" value={`${metrics.validationRate}%`} icon="✅" />
          </div>

          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Cours par matière</h2>
            {subjectBreakdown.length === 0 ? (
              <p className="text-sm text-app-text/50">Aucun cours pour l'instant.</p>
            ) : (
              <ul className="space-y-3">
                {subjectBreakdown.map(({ subject, count, percent }) => (
                  <li key={subject}>
                    <Link
                      to={`/cours?matiere=${encodeURIComponent(subject === "Sans matière" ? "" : subject)}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium group-hover:text-primary transition-app">
                          {subject}
                        </span>
                        <span className="text-xs text-app-text/50">
                          {count} cours
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-app-bg overflow-hidden">
                        <div
                          className="h-full rounded-full bg-secondary group-hover:bg-primary transition-app"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Cours récents</h2>
            {recentCourses.length === 0 ? (
              <EmptyState
                title="Aucun cours pour l'instant"
                description={
                  isTeacher
                    ? "Commencez par créer votre premier cours pour pouvoir générer un quiz."
                    : "Aucun enseignant n'a encore publié de cours."
                }
                action={
                  isTeacher && (
                    <Link to="/cours/nouveau">
                      <Button variant="accent">Créer un cours</Button>
                    </Link>
                  )
                }
              />
            ) : (
              <ul className="divide-y divide-app-text/10">
                {recentCourses.map((course) => (
                  <li key={course.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link to={`/cours/${course.id}/editer`} className="font-medium hover:text-primary">
                        {course.title}
                      </Link>
                      <p className="text-xs text-app-text/50">
                        {course.subject || "Sans matière"} · {course.level || "Niveau non précisé"}
                      </p>
                    </div>
                    <Badge color={course.quiz_count > 0 ? "secondary" : "primary"}>
                      {course.quiz_count > 0 ? `${course.quiz_count} quiz` : "Sans quiz"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
