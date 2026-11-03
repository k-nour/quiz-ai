/**
 * components/layout/AppLayout.jsx
 * -----------------------------------
 * Layout englobant les pages "privées" de l'application.
 * Redirige automatiquement vers /connexion si l'utilisateur n'est pas authentifié
 * (route protégée côté React).
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Spinner } from "../ui";

export function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  // Tant qu'on ne sait pas encore si l'utilisateur est connecté (vérif du token au démarrage)
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-app-bg">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <div className="flex bg-app-bg min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
