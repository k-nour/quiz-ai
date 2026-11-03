/**
 * components/ui/index.jsx
 * --------------------------
 * Petite bibliothèque de composants d'interface réutilisables dans toute l'application :
 * Button, Card, Badge, Modal, Alert, Spinner, EmptyState.
 * Regrouper ces composants ici évite de dupliquer du style/comportement partout.
 */

import { useEffect } from "react";

/** Bouton stylé, avec plusieurs variantes de couleur. */
export function Button({ children, variant = "primary", type = "button", onClick, disabled, className = "" }) {
  const variants = {
    primary: "bg-primary text-white hover:opacity-90",
    accent: "bg-accent text-white hover:opacity-90",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "bg-transparent text-primary border border-primary hover:bg-primary/10",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-app disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Carte conteneur générique avec fond blanc et ombre légère. */
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>{children}</div>
  );
}

/** Petit badge coloré (ex: statut "validé"/"en attente"). */
export function Badge({ children, color = "secondary" }) {
  const colors = {
    secondary: "bg-secondary/20 text-secondary",
    accent: "bg-accent/20 text-accent",
    danger: "bg-danger/20 text-danger",
    primary: "bg-primary/20 text-primary",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

/** Fenêtre modale (utilisée notamment pour la confirmation de suppression). */
export function Modal({ open, onClose, title, children }) {
  // Ferme la modale avec la touche Échap, pour l'accessibilité
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-app-text mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/** Bandeau d'alerte coloré (utilisé pour afficher les erreurs des appels API). */
export function Alert({ type = "error", children }) {
  const styles = {
    error: "bg-danger/10 text-danger border border-danger/30",
    success: "bg-secondary/10 text-secondary border border-secondary/30",
    info: "bg-primary/10 text-primary border border-primary/30",
  };
  return (
    <div className={`px-4 py-3 rounded-lg text-sm ${styles[type]}`} role="alert">
      {children}
    </div>
  );
}

/** Petit indicateur de chargement (spinner animé). */
export function Spinner({ className = "" }) {
  return (
    <div
      className={`animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent ${className}`}
      role="status"
      aria-label="Chargement en cours"
    />
  );
}

/** État "aucune donnée" affiché quand une liste est vide. */
export function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-12">
      <p className="text-lg font-semibold text-app-text">{title}</p>
      {description && <p className="text-sm text-app-text/60 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
