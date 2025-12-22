// src/components/ChangePasswordForm.jsx
import React, { useState } from "react";
import { Users } from "@/features/inventory/services/inventory.api";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function ChangePasswordForm({ userId, userEmail, onLogout }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Por favor, completa ambos campos.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      await Users.updatePassword(userId, newPassword);
      setSuccess("Contraseña actualizada correctamente.");
      setNewPassword("");
      setConfirmPassword("");

      if (onLogout) {
        setTimeout(() => onLogout(), 2000);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error || "Error al actualizar la contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 mx-auto bg-white border shadow-md rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Cambiar contraseña
        </h3>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 mb-4 text-sm text-green-700 border border-green-200 rounded-lg bg-green-50">
          <CheckCircle2 className="w-4 h-4 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo oculto para autocompletado */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={userEmail || ""}
          hidden
          readOnly
        />

        {/* Nueva contraseña */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escribe tu nueva contraseña"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              {showNew ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Mínimo 8 caracteres. Combina letras, números y símbolos si es posible.
          </p>
        </div>

        {/* Confirmar contraseña */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Vuelve a escribir la contraseña"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-sm font-semibold text-white rounded-lg 
            ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordForm;