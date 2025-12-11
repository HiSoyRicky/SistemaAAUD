import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import LogoAAUDCPS from '@/assets/images/AAUDCPS.png';
import { set } from 'zod';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('guest');
  const navigate = useNavigate();
  const { login, isAuthenticated, setAuthData } = useAuth();
  const [retryAfter, setRetryAfter] = useState(0);

  // Guardar en localStorage el tiempo hasta el que está bloqueado el login
  localStorage.setItem('loginBlockedUntil', Date.now() + retryAfter * 1000);

  // En useEffect al cargar LoginPage
  useEffect(() => {
    const blockedUntil = localStorage.getItem('loginBlockedUntil');
    if (blockedUntil) {
      const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
      if (remaining > 0) setRetryAfter(remaining);
      else localStorage.removeItem('loginBlockedUntil');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/selector');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (retryAfter > 0) return;

    setError('');
    setLoading(true);

    if (loginMode === 'login') {
      try {
        await login(username, password);
      } catch (err) {
        console.error('Error de inicio de sesión:', err);

        // Si es un Error normal
        if (err.message) {
          setRetryAfter(err.retryAfter);
          setError(err.message);
        }
        // Si es un error de Axios con data
        else if (err.response?.data?.error) {
          setError(err.response.data.error);
          const wait = err.response.data.retryAfter || 0;
          if (wait > 0) setRetryAfter(wait);
        } else {
          setError('Error al iniciar sesión. Verifica tus credenciales.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Invitado (sin cuenta)
      setAuthData({
        user: {
          id: 2,
          username: 'Invitado',
          nombre_completo: 'Usuario Invitado',
          id_rol: 4,
        },
        userType: 'trabajador',
        loggedUserName: 'Invitado',
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 to-blue-600">

      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-xl">
        <h2 className="text-5xl font-bold text-center text-gray-900">Bienvenido</h2>

        {/* Logo debajo del título */}
        <img
          src={LogoAAUDCPS}
          alt="Logo"
          className="object-contain max-w-xs mx-auto mb-6 w-1/8"
        />

        <p className="mb-6 text-center text-gray-600">
          Accede a nuestro Sistema AAUD
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Si estamos en login mode, mostrar el formulario */}
          {loginMode === 'login' && (
            <>
              <div>
                <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Ingresa tu usuario"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Ingresa tu contraseña"
                  required
                  autoComplete="current-password"
                />
              </div>
            </>
          )}

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className="relative px-4 py-3 text-sm text-red-700 bg-red-100 border border-red-400 rounded">
              <strong className="font-bold">Error:</strong>
              <span className="block ml-1 sm:inline">{error}</span>
              {retryAfter > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Vuelve a intentarlo en {Math.floor(retryAfter / 60)}:
                  {String(retryAfter % 60).padStart(2, '0')} segundos
                </div>
              )}
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading || retryAfter > 0}
            className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700"
          >
            {loading
              ? 'Cargando...'
              : retryAfter > 0
                ? 'Espera...'
                : loginMode === 'login'
                  ? 'Iniciar Sesión'
                  : 'Acceder y Reportar'}
          </button>
        </form>

        {/* Botón inferior para cambiar entre modos */}
        <div className="mt-6 text-center">
          {loginMode === 'guest' ? (
            <button
              className="font-medium text-blue-600 hover:underline"
              onClick={() => {
                setLoginMode('login');
                setError('');
                setUsername('');
                setPassword('');
              }}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          ) : (
            <button
              className="font-medium text-blue-600 hover:underline"
              onClick={() => {
                setLoginMode('guest');
                setError('');
                setUsername('');
                setPassword('');
              }}
            >
              Menú de invitado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
