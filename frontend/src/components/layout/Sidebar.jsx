/**
 * components/layout/Sidebar.jsx
 * --------------------------------
 * Barre de navigation latérale affichée sur toutes les pages protégées.
 * Utilise NavLink de react-router-dom pour surligner automatiquement le lien actif.
 */

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
  const { user, logout } = useAuth();
  const isTeacher = user?.role === "enseignant";

  const links = [
    { to: "/tableau-de-bord", label: "Tableau de bord", icon: "📊" },
    { to: "/cours", label: isTeacher ? "Mes cours" : "Cours", icon: "📚" },
    { to: "/quiz", label: isTeacher ? "Mes quiz" : "Quiz", icon: "📝" },
    { to: "/parametres", label: "Paramètres", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold">EduQuizAI</h1>
        <p className="text-xs text-white/60">by SchoolUp</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-app ${
                isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-sm font-medium truncate">{user?.first_name || user?.username}</p>
        <p className="text-xs text-white/50 truncate">{user?.email}</p>
        <span className="inline-block mt-2 mb-3 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-white">
          {user?.role === "enseignant" ? "👩‍🏫 Enseignant" : "🎓 Élève"}
        </span>
        <button
          onClick={logout}
          className="w-full text-left text-sm text-white/70 hover:text-white transition-app"
        >
          🚪 Se déconnecter
        </button>
      </div>
    </aside>
  );
}
