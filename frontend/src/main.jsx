/**
 * main.jsx
 * --------
 * Point d'entrée de l'application React. C'est le premier fichier exécuté
 * par le navigateur : il crée la racine React, active le mode BrowserRouter
 * (pour la navigation entre pages) et englobe toute l'app dans le
 * AuthProvider (pour que la connexion soit accessible partout).
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
