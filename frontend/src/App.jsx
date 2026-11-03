/**
 * App.jsx
 * -------
 * Déclare toutes les routes de l'application avec React Router v6.
 * Les routes "privées" (tableau de bord, cours, quiz, paramètres) sont
 * regroupées sous le layout <AppLayout>, qui redirige automatiquement
 * vers /connexion si l'utilisateur n'est pas authentifié.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import List from "./pages/List";
import Form from "./pages/Form";
import AiGenerate from "./pages/AiGenerate";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      {/* Page publique */}
      <Route path="/connexion" element={<Login />} />

      {/* Groupe de routes privées, protégées par AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/tableau-de-bord" element={<Dashboard />} />

        {/* Cours : liste, création, édition */}
        <Route path="/cours" element={<List resource="cours" />} />
        <Route path="/cours/nouveau" element={<Form mode="create" />} />
        <Route path="/cours/:id/editer" element={<Form mode="edit" />} />
        <Route path="/cours/:id/generer-ia" element={<AiGenerate />} />

        {/* Quiz : liste uniquement (créés via la génération IA) */}
        <Route path="/quiz" element={<List resource="quiz" />} />

        <Route path="/parametres" element={<Settings />} />
      </Route>

      {/* Redirections par défaut */}
      <Route path="/" element={<Navigate to="/tableau-de-bord" replace />} />
      <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
    </Routes>
  );
}
