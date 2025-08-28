// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LogoAAUDCPS from '../assets/images/AAUDCPS.png'; // Asegúrate de que la ruta sea correcta

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('guest'); // Por defecto: reportar sin cuenta
  const navigate = useNavigate();
  const { login, isAuthenticated, setAuthData } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/selector');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (loginMode === 'login') {
      try {
        await login(username, password);
      } catch (err) {
        console.error('Error de inicio de sesión:', err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
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
        token: null,
        userType: 'trabajador',
        loggedUserName: 'Invitado',
      });
      navigate('/selector');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-blue-600 p-4">

      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-5xl font-bold text-center text-gray-900">Bienvenido</h2>

        {/* Logo debajo del título */}
        <img
          src={LogoAAUDCPS}
          alt="Logo"
          className="w-1/8 max-w-xs object-contain mx-auto mb-6"
        />

        <p className="text-center text-gray-600 mb-6">
          Accede a nuestro sistema AAUD.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* Si estamos en login mode, mostrar el formulario */}
          {loginMode === 'login' && (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                />
              </div>
            </>
          )}

          {/* Mostrar mensaje de error si existe */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-1">{error}</span>
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded"
          >
            {loading
              ? 'Cargando...'
              : loginMode === 'login'
                ? 'Iniciar Sesión'
                : 'Acceder y Reportar'}
          </button>
        </form>

        {/* Botón inferior para cambiar entre modos */}
        <div className="mt-6 text-center">
          {loginMode === 'guest' ? (
            <button
              className="text-blue-600 hover:underline font-medium"
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
              className="text-blue-600 hover:underline font-medium"
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
