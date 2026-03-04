// AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

function normalizeRoleName(roleName) {
  return String(roleName || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveUserType({ roleId, roleName }) {
  const userRoleMap = {
    1: 'admin',
    2: 'tecnico',
    3: 'consultor',
    4: 'trabajador',
    5: 'mensajeria',
  };

  if (Number.isInteger(Number(roleId))) {
    const mapped = userRoleMap[Number(roleId)];
    if (mapped) {
      return mapped;
    }
  }

  const normalized = normalizeRoleName(roleName);
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('tecnico')) return 'tecnico';
  if (normalized.includes('consultor')) return 'consultor';
  if (normalized.includes('mensajeria')) return 'mensajeria';

  return 'trabajador';
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loggedUserName, setLoggedUserName] = useState(null);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const storedUserType = sessionStorage.getItem('userType');
    const storedUserName = sessionStorage.getItem('loggedUserName');
    const storedUserId = sessionStorage.getItem('loggedUserId');
    const storedUsername = sessionStorage.getItem('username');
    const storedMustChangePassword = sessionStorage.getItem('mustChangePassword');

    if (token && storedUserType && storedUserName && storedUserId) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
      setLoggedUserName(storedUserName);
      setLoggedUserId(storedUserId);
      setUsername(storedUsername);
      setMustChangePassword(storedMustChangePassword === 'true');
    }
    else if (token) {
      try {
        const decoded = jwtDecode(token);

        const type = resolveUserType({
          roleId: decoded.roleId ?? decoded.id_rol ?? decoded.role,
          roleName: decoded.role
        });
        const decodedMustChange = Boolean(decoded.mustChangePassword);

        setIsAuthenticated(true);
        setUserType(type);
        setLoggedUserName(decoded.nombre_completo || decoded.username);
        setLoggedUserId(decoded.id);
        setUsername(decoded.username);
        setMustChangePassword(decodedMustChange);

        sessionStorage.setItem('userType', type);
        sessionStorage.setItem('loggedUserName', decoded.nombre_completo || decoded.username || '');
        sessionStorage.setItem('loggedUserId', decoded.id);
        sessionStorage.setItem('username', decoded.username || '');
        sessionStorage.setItem('mustChangePassword', String(decodedMustChange));

      } catch (error) {
        logout();
      }
    }

    setLoading(false);
  }, []);

  const login = async (loginIdentifier, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username: loginIdentifier, password });
      const { usuario, token } = response.data;
      const mustChange = Boolean(usuario?.must_change_password);

      localStorage.setItem("token", token);
      const type = resolveUserType({
        roleId: usuario.id_rol,
        roleName: usuario.role_name
      });

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
      setMustChangePassword(mustChange);

      sessionStorage.setItem('user', JSON.stringify(usuario));
      sessionStorage.setItem('userType', type);
      sessionStorage.setItem('loggedUserName', usuario.nombre_completo || resolvedUsername);
      sessionStorage.setItem('loggedUserId', usuario.id);
      sessionStorage.setItem('username', resolvedUsername);
      sessionStorage.setItem('mustChangePassword', String(mustChange));

      return { success: true, userType: type, mustChangePassword: mustChange };
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
    const nextMustChangePassword = Boolean(data.mustChangePassword);
    setIsAuthenticated(true);
    setUserType(data.userType);
    setLoggedUserName(data.loggedUserName);
    setLoggedUserId(data.user ? data.user.id : null);
    setMustChangePassword(nextMustChangePassword);

    sessionStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('userType', data.userType);
    sessionStorage.setItem('loggedUserName', data.loggedUserName);
    sessionStorage.setItem('loggedUserId', data.user ? data.user.id : null);
    sessionStorage.setItem('mustChangePassword', String(nextMustChangePassword));

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
    setMustChangePassword(false);

    sessionStorage.clear();
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userType,
        loggedUserName,
        loggedUserId,
        username,
        mustChangePassword,
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


