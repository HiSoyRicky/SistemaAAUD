import React from "react";
import ChangePasswordForm from "@/features/auth/forms/ChangePasswordForm";
import useAuth from "@/shared/hooks/useAuth";

function ForcedPasswordChangePage() {
  const { loggedUserId, username, logout } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-br from-slate-100 to-blue-50">
      <div className="w-full max-w-2xl space-y-5">
        <div className="p-6 bg-white border border-blue-100 shadow-sm rounded-2xl">
          <h1 className="text-2xl font-bold text-slate-800">Cambio de contraseña requerido</h1>
          <p className="mt-2 text-sm text-slate-600">
            Por seguridad debes actualizar tu contraseña antes de continuar usando el sistema.
          </p>
        </div>

        <ChangePasswordForm
          userId={loggedUserId}
          userEmail={username}
          onLogout={logout}
        />
      </div>
    </div>
  );
}

export default ForcedPasswordChangePage;
