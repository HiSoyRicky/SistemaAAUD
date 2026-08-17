// Header.jsx

import LogoSistemaAAUD from '@/assets/images/LogoSistemaAAUD.png';
import { ChevronDown, LogOut, Menu, Settings, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getNavigation } from '../../config/Navigation';
import useAuth from '../../hooks/useAuth';

function Header({ sidebarFixed }) {
  const { isAuthenticated, userType, loggedUserName, logout, hasPermission } = useAuth();

  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuItems = getNavigation(userType, hasPermission);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const initials = useMemo(() => {
    if (!loggedUserName) return '?';
    return loggedUserName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }, [loggedUserName]);

  const ROLE_LABELS = {
    admin: 'Admin',
    tecnico: 'Técnico',
    consultor: 'Consultor',
  };

  const roleLabel = ROLE_LABELS[userType] || 'Trabajador';

  const goTo = (path) => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    navigate(path);
  };

  // Cierra dropdowns al hacer click afuera
  useEffect(() => {
    const onDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        // si click afuera del panel mobile y estaba abierto
        // (pero no cierres si el click es en el botón hamburguesa: lo manejamos aparte)
        if (mobileOpen) setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [mobileOpen]);

  // Cierra menú mobile si cambia el tamaño a desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900">
      <div className="px-3 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <button
            type="button"
            onClick={() => goTo('/dashboard')}
            className="flex items-center gap-3 group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md">
              <img src={LogoSistemaAAUD} alt="Logo AAUD" className="object-contain" />
            </div>

            <div className="flex flex-col items-start leading-none">
              <span className="text-base font-extrabold tracking-wide text-white md:text-lg">
                Sistema AAUD
              </span>
              <span className="hidden text-xs text-white/70 md:block">
                Soporte • Incidencias • Inventario
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            {isAuthenticated && (
              <button
                type="button"
                className="inline-flex items-center justify-center w-10 h-10 text-white transition md:hidden rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
                onClick={() => setMobileOpen((p) => !p)}
                aria-label="Abrir menú"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* User menu */}
            {isAuthenticated && (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-2 py-1 transition rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
                >
                  <div className="flex items-center justify-center font-extrabold bg-white rounded-full shadow-sm h-9 w-9 text-slate-900">
                    {initials}
                  </div>

                  <span className="hidden pr-1 md:flex md:flex-col md:items-start">
                    <span className="text-sm font-semibold leading-tight text-white">
                      {loggedUserName}
                    </span>
                    <span className="text-xs leading-tight text-white/70">{roleLabel}</span>
                  </span>

                  <ChevronDown
                    className={`hidden md:block w-4 h-4 text-white/90 transition-transform ${
                      userMenuOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 w-56 mt-2 overflow-hidden bg-white shadow-xl rounded-2xl ring-1 ring-black/10">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-sm font-semibold text-slate-900">{loggedUserName}</div>
                      <div className="text-xs text-slate-500">{roleLabel}</div>
                    </div>

                    <div className="p-2">
                      {/* SOLO si NO es trabajador */}
                      {userType !== 'trabajador' && (
                        <button
                          type="button"
                          onClick={() => goTo('/perfil')}
                          className="flex items-center w-full gap-2 px-3 py-2 text-sm transition rounded-xl text-slate-700 hover:bg-slate-100"
                        >
                          <Settings className="w-4 h-4" />
                          Mi perfil
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setMobileOpen(false);
                          logout();
                        }}
                        className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 transition rounded-xl hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile panel */}
        {isAuthenticated && mobileOpen && (
          <div ref={mobileMenuRef} className="pb-3 md:hidden">
            <div className="p-2 mt-2 rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
              <div className="grid gap-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition',
                        isActive
                          ? 'bg-white text-slate-900'
                          : 'text-white/90 hover:bg-white/10 hover:text-white',
                      ].join(' ')
                    }
                  >
                    {/* Renderizamos el componente de icono correctamente */}
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}

                <div className="h-px my-1 bg-white/10" />

                <button
                  type="button"
                  onClick={() => goTo('/perfil')}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition rounded-xl text-white/90 hover:bg-white/10 hover:text-white"
                >
                  <Settings className="w-5 h-5" />
                  Mi perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-200 transition rounded-xl hover:bg-white/10"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
