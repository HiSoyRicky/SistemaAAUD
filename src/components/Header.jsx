// src/components/Header.jsx
import { LogOut } from "lucide-react";
import useAuth from '@/hooks/useAuth';

function Header() {
  const { isAuthenticated, userType, loggedUserName, logout } = useAuth();

  // Obtener iniciales para avatar
  const initials = loggedUserName
    ? loggedUserName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
    : '';

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Sistema AAUD
        </h1>

        {isAuthenticated && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center shadow-md">
                {initials}
              </div>
              <span className="hidden md:inline text-lg font-medium">
                {loggedUserName} (
                {userType === 'admin'
                  ? 'Administrador'
                  : userType === 'tecnico'
                    ? 'Técnico'
                    : userType === 'secretaria'
                      ? 'Secretaria'
                      : 'Trabajador'}
                )
              </span>
            </div>

            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
