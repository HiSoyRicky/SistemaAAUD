import React, { useState } from "react";
import useAuth from "@/shared/hooks/useAuth";
import ChangePasswordForm from "@/features/auth/forms/ChangePasswordForm";
import { User, Shield, KeyRound, ChevronDown } from "lucide-react";

function ProfilePage() {
    const { loggedUserName, userType, loggedUserId, logout, username } = useAuth();
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const roleLabel =
        userType === "admin"
            ? "Administrador"
            : userType === "tecnico"
                ? "Técnico"
                : userType === "consultor"
                    ? "Consultor"
                    : userType === "mensajeria"
                        ? "Mensajería"
                        : "Trabajador";


    const initials = loggedUserName
        ? loggedUserName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
        : "?";

    return (
        <div className="max-w-2xl px-4 py-8 mx-auto">
            {/* Tarjeta principal */}
            <div className="p-6 bg-white shadow-md rounded-2xl">
                {/* Encabezado */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center text-xl font-bold text-blue-700 border border-blue-100 rounded-full w-14 h-14 bg-blue-50">
                        {initials}
                    </div>
                    <div>
                        <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
                            <User className="w-5 h-5 text-blue-600" />
                            Mi perfil
                        </h2>
                        <p className="text-sm text-gray-500">
                            Información de tu cuenta en el sistema AAUD.
                        </p>
                    </div>
                </div>

                {/* Info de usuario */}
                <div className="grid gap-4 mb-6 md:grid-cols-2">
                    <div className="p-3 border rounded-xl bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                            Nombre completo
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                            {loggedUserName}
                        </p>
                    </div>

                    <div className="p-3 border rounded-xl bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                            Usuario
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                            {username || "—"}
                        </p>

                    </div>

                    <div className="p-3 border rounded-xl bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase">
                            Rol
                        </p>
                        <div className="inline-flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 rounded-full bg-blue-50">
                                <Shield className="w-3 h-3" />
                                {roleLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sección cambio de contraseña */}
                <div className="pt-4 mt-2 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => setShowPasswordForm((prev) => !prev)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left text-blue-700 transition-colors rounded-lg hover:bg-blue-50"
                    >
                        <span className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4" />
                            Cambiar contraseña
                        </span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform ${showPasswordForm ? "rotate-180" : "rotate-0"
                                }`}
                        />
                    </button>

                    {showPasswordForm && (
                        <div className="mt-3 animate-fadeIn">
                            <ChangePasswordForm
                                userId={loggedUserId}
                                onLogout={logout}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;