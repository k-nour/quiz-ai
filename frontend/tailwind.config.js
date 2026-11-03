// tailwind.config.js
// Configuration de TailwindCSS : on scanne tous les fichiers src/ pour générer
// uniquement les classes CSS réellement utilisées (optimisation de la taille finale).
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        secondary: "var(--secondary)",
        danger: "var(--danger)",
        "app-text": "var(--text)",
        "app-bg": "var(--bg)",
      },
    },
  },
  plugins: [],
};
