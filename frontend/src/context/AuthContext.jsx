/**
 * context/AuthContext.jsx
 * -------------------------
 * Contexte React global qui gère l'authentification de l'utilisateur :
 * - stocke les tokens JWT (access/refresh) dans le localStorage
 * - expose l'utilisateur connecté, et les fonctions login/register/logout
 * - permet à n'importe quel composant de savoir si l'utilisateur est connecté
 *   via le hook useAuth()
 */

import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, logoutUser, fetchMe } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true tant qu'on vérifie si un token existe déjà

  // Au premier chargement de l'app, si un token est présent, on récupère le profil
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        // Token invalide ou expiré : on nettoie tout
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setLoading(false));
  }, []);

  /** Connecte l'utilisateur : récupère les tokens JWT, puis charge son profil. */
  async function login(email, password) {
    const { access, refresh } = await loginUser({ email, password });
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const me = await fetchMe();
    setUser(me);
  }

  /** Inscrit l'utilisateur puis le connecte automatiquement. */
  async function register(formData) {
    await registerUser(formData);
    await login(formData.email, formData.password);
  }

  /** Déconnecte l'utilisateur : blackliste le refresh token côté serveur et nettoie le localStorage. */
  async function logout() {
    try {
      await logoutUser();
    } catch {
      // même si l'appel échoue (ex: token déjà expiré), on nettoie quand même côté front
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook pratique pour accéder au contexte d'authentification depuis n'importe quel composant. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth() doit être utilisé à l'intérieur d'un <AuthProvider>.");
  }
  return context;
}
