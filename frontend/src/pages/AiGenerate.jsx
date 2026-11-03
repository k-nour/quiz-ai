/**
 * pages/AiGenerate.jsx
 * ----------------------
 * Interface de génération de quiz par IA (Ollama) à partir d'un cours existant.
 * - L'enseignant choisit le mix de questions (QCM / Vrai-Faux / ouvertes) et la difficulté.
 * - Le résultat s'affiche en streaming (effet "machine à écrire").
 * - Si Ollama n'est pas lancé, un message d'erreur clair est affiché (fallback).
 * - Avant sauvegarde définitive, l'enseignant peut relire et valider le quiz
 *   ("vérification humaine" imposée par le cahier des charges).
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCourse, generateQuizWithAI, saveQuiz } from "../services/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { Card, Button, Alert, Spinner, Badge } from "../components/ui";

export default function AiGenerate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === "enseignant";

  const { data: course, loading: loadingCourse, error: courseError } = useApi(() => fetchCourse(id), [id]);

  // Réservé aux enseignants : un élève ne doit pas pouvoir générer de quiz,
  // même en accédant directement à l'URL.
  if (!isTeacher) {
    return (
      <Alert type="error">
        Seuls les enseignants peuvent générer un quiz avec l'IA.
      </Alert>
    );
  }

  const [config, setConfig] = useState({ nb_qcm: 4, nb_vrai_faux: 3, nb_ouvertes: 2, difficulty: "intermédiaire" });
  const [streamingText, setStreamingText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [quiz, setQuiz] = useState(null); // quiz parsé, prêt pour vérification humaine
  const [validated, setValidated] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateConfig(field, value) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGenerate() {
    // Réinitialise l'aperçu et affiche chaque morceau reçu pendant le streaming.
    setGenError("");
    setQuiz(null);
    setValidated(false);
    setStreamingText("");
    setGenerating(true);

    try {
      const fullText = await generateQuizWithAI(
        { content: course.content, ...config },
        (_chunk, current) => setStreamingText(current)
      );

      // Le modèle est censé répondre en JSON pur ; on tente de l'extraire même
      // s'il y a un peu de texte parasite autour.
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        const preview = fullText.trim().slice(0, 200) || "(réponse vide)";
        throw new Error(
          `La réponse de l'IA n'a pas pu être interprétée comme un quiz valide. Extrait reçu : "${preview}"`
        );
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        const preview = jsonMatch[0].trim().slice(0, 200);
        throw new Error(`Le JSON renvoyé par l'IA est mal formé. Extrait reçu : "${preview}"`);
      }

      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        throw new Error(
          "L'IA a renvoyé un quiz sans aucune question. Cliquez à nouveau sur \"Générer avec l'IA\" " +
          "pour réessayer, ou réduisez le nombre de questions demandées."
        );
      }

      setQuiz(parsed);
    } catch (err) {
      setGenError(err.message || "La génération du quiz a échoué.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    // Convertit la réponse de l'IA au format attendu par le serializer Django.
    if (!quiz) return;
    setSaving(true);
    setGenError("");
    try {
      await saveQuiz({
        course: Number(id),
        title: quiz.title || `Quiz - ${course.title}`,
        validated,
        questions: quiz.questions.map((q) => ({
          type: q.type,
          text: q.text,
          choices: q.choices || [],
          correct_answer: q.correct_answer,
          explanation: q.explanation || "",
        })),
      });
      navigate("/quiz");
    } catch (err) {
      setGenError(err.message || "Impossible d'enregistrer le quiz.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingCourse) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (courseError) {
    return <Alert type="error">{courseError}</Alert>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-app-text mb-1">Générer un quiz avec l'IA</h1>
      <p className="text-sm text-app-text/60 mb-6">Cours source : {course.title}</p>

      <Card className="mb-6">
        <h2 className="font-semibold mb-3">Configuration du quiz</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">QCM</label>
            <input
              type="number" min={0} max={15}
              className="w-full border rounded-lg px-3 py-2"
              value={config.nb_qcm}
              onChange={(e) => updateConfig("nb_qcm", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Vrai / Faux</label>
            <input
              type="number" min={0} max={15}
              className="w-full border rounded-lg px-3 py-2"
              value={config.nb_vrai_faux}
              onChange={(e) => updateConfig("nb_vrai_faux", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Questions ouvertes</label>
            <input
              type="number" min={0} max={15}
              className="w-full border rounded-lg px-3 py-2"
              value={config.nb_ouvertes}
              onChange={(e) => updateConfig("nb_ouvertes", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Difficulté</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={config.difficulty}
              onChange={(e) => updateConfig("difficulty", e.target.value)}
            >
              <option value="facile">Facile</option>
              <option value="intermédiaire">Intermédiaire</option>
              <option value="difficile">Difficile</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Button variant="accent" onClick={handleGenerate} disabled={generating}>
            {generating ? "Génération en cours..." : "✨ Générer avec l'IA"}
          </Button>
        </div>
      </Card>

      {genError && (
        <div className="mb-6">
          <Alert type="error">{genError}</Alert>
        </div>
      )}

      {generating && !quiz && (
        <Card className="mb-6">
          <p className="text-xs text-app-text/50 mb-2">Réponse de l'IA en cours de réception...</p>
          <pre className="text-xs whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">{streamingText}</pre>
        </Card>
      )}

      {quiz && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{quiz.title || "Quiz généré"}</h2>
            <Badge color="accent">Vérification humaine requise</Badge>
          </div>

          <ul className="space-y-4">
            {quiz.questions?.map((q, index) => (
              <li key={index} className="border-b border-app-text/10 pb-3">
                <p className="text-sm font-medium">
                  {index + 1}. {q.text} <span className="text-xs text-app-text/40">({q.type})</span>
                </p>
                {q.choices?.length > 0 && (
                  <ul className="mt-1 ml-4 text-sm text-app-text/70 list-disc">
                    {q.choices.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                )}
                <p className="text-xs text-app-text/50 mt-1">Réponse : {q.correct_answer}</p>
                {q.explanation && <p className="text-xs text-app-text/50">Explication : {q.explanation}</p>}
              </li>
            ))}
          </ul>

          <label className="flex items-center gap-2 mt-4 text-sm">
            <input type="checkbox" checked={validated} onChange={(e) => setValidated(e.target.checked)} />
            J'ai relu ce quiz et je le valide pour publication à mes élèves.
          </label>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={handleGenerate} disabled={generating}>Régénérer</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : validated ? "Enregistrer (validé)" : "Enregistrer sans valider"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
