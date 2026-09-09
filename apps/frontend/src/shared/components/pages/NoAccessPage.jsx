// NoAccessPage.jsx

import { ShieldAlert } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export default function NoAccessPage() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <ShieldAlert className="h-12 w-12 text-amber-500" />
      <h1 className="text-2xl font-bold text-slate-900">Sin acceso a ningún módulo</h1>
      <p className="max-w-md text-sm text-slate-500">
        Tu usuario no tiene permisos asignados a ningún módulo del sistema. Contacta a un
        administrador para que revise tu rol y tus permisos.
      </p>
      <button
        type="button"
        onClick={logout}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
