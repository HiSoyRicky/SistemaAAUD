// AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loggedUserName, setLoggedUserName] = useState(null);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedUserType = sessionStorage.getItem('userType');
    const storedUserName = sessionStorage.getItem('loggedUserName');
    const storedUserId = sessionStorage.getItem('loggedUserId');
    const storedUsername = sessionStorage.getItem('username');

    // Evitar valores basura como "undefined" o "null"
    const safeUsername =
      storedUsername && storedUsername !== 'undefined' && storedUsername !== 'null'
        ? storedUsername
        : null;

    if (storedUser && storedUserType && storedUserName && storedUserId && safeUsername) {
      try {
        setIsAuthenticated(true);
        setUserType(storedUserType);
        setLoggedUserName(storedUserName);
        setLoggedUserId(storedUserId);
        setUsername(safeUsername);
      } catch (e) {
        console.error("Error parsing stored user data:", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginIdentifier, password) => {
    try {
      const response = await axios.post('/api/login', { username: loginIdentifier, password });
      const { usuario } = response.data;

      const userRoleMap = {
        1: 'admin',
        2: 'tecnico',
        3: 'secretaria',
        4: 'trabajador',
      };

      const type = userRoleMap[usuario.id_rol] || 'trabajador';

      // Resolver username de forma segura
      const resolvedUsername =
        usuario.username ||
        usuario.usuario ||
        usuario.correo ||
        loginIdentifier ||
        '';

      setIsAuthenticated(true);
      setUserType(type);
      setLoggedUserName(usuario.nombre_completo || resolvedUsername);
      setLoggedUserId(usuario.id);
      setUsername(resolvedUsername);

      sessionStorage.setItem('user', JSON.stringify(usuario));
      sessionStorage.setItem('userType', type);
      sessionStorage.setItem('loggedUserName', usuario.nombre_completo || resolvedUsername);
      sessionStorage.setItem('loggedUserId', usuario.id);
      sessionStorage.setItem('username', resolvedUsername);

      return { success: true, userType: type };
    } catch (error) {
      console.error('Login failed:', error?.response?.data || error.message);
      logout();

      if (error.response?.status === 429) {
        throw {
          message: error.response.data?.error || 'Demasiados intentos fallidos.',
          retryAfter: error.response.data?.retryAfter || 0,
        };
      }

      throw new Error(error.response?.data?.error || 'Error desconocido al iniciar sesión');
    }
  };

  const setAuthData = (data) => {
    setIsAuthenticated(true);
    setUserType(data.userType);
    setLoggedUserName(data.loggedUserName);
    setLoggedUserId(data.user ? data.user.id : null);

    sessionStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('userType', data.userType);
    sessionStorage.setItem('loggedUserName', data.loggedUserName);
    sessionStorage.setItem('loggedUserId', data.user ? data.user.id : null);

    if (data.username) {
      setUsername(data.username);
      sessionStorage.setItem('username', data.username);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setLoggedUserName(null);
    setLoggedUserId(null);
    setUsername(null);
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userType,
        loggedUserName,
        loggedUserId,
        username,
        loading,
        login,
        logout,
        setAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };
