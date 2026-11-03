/**
 * pages/Settings.jsx
 * -------------------
 * Page "Paramètres" : modification du profil (nom/email), export RGPD des
 * données personnelles au format JSON, et suppression de compte (protégée
 * par une confirmation où l'utilisateur doit taper "SUPPRIMER").
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, exportMyData, deleteAccount } from "../services/api";
import { Card, Button, Alert, Modal } from "../components/ui";

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", email: user?.email || "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleProfileSubmit(e) {
    // Envoie les champs modifiables, puis synchronise le contexte global.
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage({ type: "", text: "" });
    try {
      const updated = await updateProfile(form);
      setUser(updated);
      setProfileMessage({ type: "success", text: "Profil mis à jour avec succès." });
    } catch (err) {
      setProfileMessage({ type: "error", text: err.message || "Impossible de mettre à jour le profil." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleExport() {
    // Transforme le Blob reçu en téléchargement déclenché par le navigateur.
    setExporting(true);
    setExportError("");
    try {
      const blob = await exportMyData();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mes-donnees-eduquizai.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err.message || "L'export de vos données a échoué.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    // Le backend vérifie lui aussi le mot de confirmation avant la suppression.
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(deleteConfirmText);
      await logout();
      navigate("/connexion");
    } catch (err) {
      setDeleteError(err.message || "La suppression du compte a échoué.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-app-text">Paramètres</h1>

      {/* --- Profil --- */}
      <Card>
        <h2 className="font-semibold mb-4">Mon profil</h2>
        {profileMessage.text && (
          <div className="mb-4">
            <Alert type={profileMessage.type}>{profileMessage.text}</Alert>
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Prénom</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.first_name}
                onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.last_name}
                onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Card>

      {/* --- Export RGPD --- */}
      <Card>
        <h2 className="font-semibold mb-1">Exporter mes données</h2>
        <p className="text-sm text-app-text/60 mb-4">
          Conformément au RGPD, téléchargez une copie de toutes vos données personnelles
          (profil, cours, quiz) au format JSON.
        </p>
        {exportError && (
          <div className="mb-4">
            <Alert type="error">{exportError}</Alert>
          </div>
        )}
        <Button variant="ghost" onClick={handleExport} disabled={exporting}>
          {exporting ? "Préparation de l'export..." : "📥 Télécharger mes données (JSON)"}
        </Button>
      </Card>

      {/* --- Suppression de compte --- */}
      <Card className="border border-danger/30">
        <h2 className="font-semibold text-danger mb-1">Zone de danger</h2>
        <p className="text-sm text-app-text/60 mb-4">
          La suppression de votre compte est définitive et effacera tous vos cours et quiz.
        </p>
        <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
          Supprimer mon compte
        </Button>
      </Card>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirmer la suppression du compte">
        <p className="text-sm text-app-text/70 mb-3">
          Cette action est irréversible. Tapez <strong>SUPPRIMER</strong> ci-dessous pour confirmer.
        </p>
        {deleteError && (
          <div className="mb-3">
            <Alert type="error">{deleteError}</Alert>
          </div>
        )}
        <input
          className="w-full border rounded-lg px-3 py-2 mb-4"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder="SUPPRIMER"
        />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Annuler</Button>
          <Button
            variant="danger"
            disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
            onClick={handleDeleteAccount}
          >
            {deleting ? "Suppression..." : "Supprimer définitivement"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
