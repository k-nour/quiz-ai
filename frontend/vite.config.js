// vite.config.js
// Configuration de Vite, l'outil de build/serveur de développement du front-end.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
