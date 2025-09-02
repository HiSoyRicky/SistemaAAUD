// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null); // 'admin', 'tecnico', 'secretaria', 'trabajador'
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

    if (storedUser && storedUserType && storedUserName && storedUserId && storedUsername) {

      try {
        setIsAuthenticated(true);
        setUserType(storedUserType);
        setLoggedUserName(storedUserName);
        setLoggedUserId(storedUserId);
        setUsername(storedUsername);
      } catch (e) {
        console.error("Error parsing stored user data:", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/login', { username, password });
      const { usuario } = response.data;

      const userRoleMap = {
        1: 'admin',      // ID 1 para Administrador
        2: 'tecnico',    // ID 2 para Técnico
        3: 'secretaria', // ID 3 para Secretaria
        4: 'trabajador', // ID 4 para Trabajador
      };

      const type = userRoleMap[usuario.id_rol] || 'trabajador'; // Default a trabajador si no coincide

      setIsAuthenticated(true);
      setUserType(type);
      setLoggedUserName(usuario.nombre_completo || usuario.username);
      setLoggedUserId(usuario.id);
      setUsername(usuario.username);

      sessionStorage.setItem('user', JSON.stringify(usuario));
      sessionStorage.setItem('userType', type);
      sessionStorage.setItem('loggedUserName', usuario.nombre_completo || usuario.username);
      sessionStorage.setItem('loggedUserId', usuario.id);
      sessionStorage.setItem('username', usuario.username);

      return { success: true, userType: type };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      logout();
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
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setLoggedUserName(null);
    setLoggedUserId(null);
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{
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
