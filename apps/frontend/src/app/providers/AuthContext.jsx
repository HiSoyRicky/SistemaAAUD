// AuthContext.jsx

import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function normalizeRoleName(roleName) {
  return String(roleName || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveUserType({ roleId, roleName }) {
  const normalized = normalizeRoleName(roleName);
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('tecnico')) return 'tecnico';
  if (normalized.includes('consultor')) return 'consultor';
  if (normalized.includes('trabajador')) return 'trabajador';

  return 'custom';
}

function normalizePermissionCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase();
}

function normalizePermissionCodes(codes = []) {
  return [...new Set(codes.map((code) => normalizePermissionCode(code)).filter(Boolean))];
}

function hasPermissionCode(requiredPermission, grantedPermissions = []) {
  const required = normalizePermissionCode(requiredPermission);

  if (!required) {
    return true;
  }

  const granted = new Set(normalizePermissionCodes(grantedPermissions));
  if (granted.has('*.*')) {
    return true;
  }

  const [module, action] = required.split('.');
  if (!module || !action) {
    return false;
  }

  return granted.has(required) || granted.has(`${module}.*`) || granted.has(`*.${action}`);
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [roleName, setRoleName] = useState(null);
  const [loggedUserName, setLoggedUserName] = useState(null);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);

  const storePermissions = (nextPermissions) => {
    const normalized = normalizePermissionCodes(nextPermissions);
    setPermissions(normalized);
    sessionStorage.setItem('permissions', JSON.stringify(normalized));
    return normalized;
  };

  const parsePermissions = (storedPermissions) => {
    if (!storedPermissions) {
      return [];
    }

    try {
      return JSON.parse(storedPermissions);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    const storedUserType = sessionStorage.getItem('userType');
    const storedRoleName = sessionStorage.getItem('roleName');
    const storedUserName = sessionStorage.getItem('loggedUserName');
    const storedUserId = sessionStorage.getItem('loggedUserId');
    const storedUsername = sessionStorage.getItem('username');
    const storedMustChangePassword = sessionStorage.getItem('mustChangePassword');
    const storedPermissions = sessionStorage.getItem('permissions');
    const parsedStoredPermissions = parsePermissions(storedPermissions);

    if (token && storedUserType && storedUserName && storedUserId) {
      let fallbackPermissions = parsedStoredPermissions;
      let restoredUserType = storedUserType;
      let restoredRoleName = storedRoleName;

      if (!fallbackPermissions.length) {
        try {
          const decoded = jwtDecode(token);
          fallbackPermissions = Array.isArray(decoded.permissions) ? decoded.permissions : [];
          restoredUserType = resolveUserType({
            roleId: decoded.roleId ?? decoded.id_rol,
            roleName: decoded.role,
          });
          restoredRoleName = decoded.role || restoredRoleName;
        } catch (_error) {
          // El token puede ser ilegible durante una sesión antigua; se conservarán permisos vacíos.
          fallbackPermissions = [];
        }
      }

      try {
        const decoded = jwtDecode(token);
        restoredUserType = resolveUserType({
          roleId: decoded.roleId ?? decoded.id_rol,
          roleName: decoded.role,
        });
        restoredRoleName = decoded.role || restoredRoleName;
      } catch (_error) {
        // Mantener compatibilidad con sesiones antiguas si el token no puede leerse.
      }

      setIsAuthenticated(true);
      setUserType(restoredUserType);
      setRoleName(restoredRoleName || null);
      setLoggedUserName(storedUserName);
      setLoggedUserId(storedUserId);
      setUsername(storedUsername);
      setMustChangePassword(storedMustChangePassword === 'true');
      storePermissions(fallbackPermissions);
      setPermissionsLoading(false);
    } else if (token) {
      try {
        const decoded = jwtDecode(token);

        const type = resolveUserType({
          roleId: decoded.roleId ?? decoded.id_rol ?? decoded.role,
          roleName: decoded.role,
        });
        const decodedMustChange = Boolean(decoded.mustChangePassword);
        const decodedPermissions = normalizePermissionCodes(
          Array.isArray(decoded.permissions) ? decoded.permissions : []
        );

        setIsAuthenticated(true);
        setUserType(type);
        setRoleName(decoded.role || null);
        setLoggedUserName(decoded.nombre_completo || decoded.username);
        setLoggedUserId(decoded.id);
        setUsername(decoded.username);
        setMustChangePassword(decodedMustChange);
        storePermissions(decodedPermissions);
        setPermissionsLoading(false);

        sessionStorage.setItem('userType', type);
        sessionStorage.setItem('roleName', decoded.role || '');
        sessionStorage.setItem('loggedUserName', decoded.nombre_completo || decoded.username || '');
        sessionStorage.setItem('loggedUserId', decoded.id);
        sessionStorage.setItem('username', decoded.username || '');
        sessionStorage.setItem('mustChangePassword', String(decodedMustChange));
        sessionStorage.setItem('permissions', JSON.stringify(decodedPermissions));
      } catch (error) {
        console.error('Error al almacenar los datos del usuario en sessionStorage: ', error);
        logout();
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem('token')) {
      return undefined;
    }

    let cancelled = false;

    const refreshPermissions = async () => {
      try {
        const response = await axios.get('/api/permissions/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          timeout: 10000,
        });

        if (!cancelled && Array.isArray(response.data?.permissions)) {
          storePermissions(response.data.permissions);
        }
      } catch (error) {
        console.warn('No se pudieron actualizar los permisos:', error);
      }
    };

    refreshPermissions();
    window.addEventListener('focus', refreshPermissions);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshPermissions);
    };
  }, [isAuthenticated]);

  const login = async (loginIdentifier, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username: loginIdentifier, password });
      const { usuario, token } = response.data;
      const mustChange = Boolean(usuario?.must_change_password);

      let nextPermissions = [];

      try {
        const permissionsResponse = await axios.get('/api/permissions/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        });

        nextPermissions = normalizePermissionCodes(permissionsResponse.data?.permissions || []);
      } catch (permissionError) {
        console.error('No se pudieron cargar los permisos del usuario:', permissionError);
      }
      console.log('PERMISOS RECIBIDOS:', nextPermissions);

      localStorage.setItem('token', token);
      const type = resolveUserType({
        roleId: usuario.id_rol,
        roleName: usuario.role_name,
      });

      // Resolver username de forma segura
      const resolvedUsername =
        usuario.username || usuario.usuario || usuario.correo || loginIdentifier || '';

      setIsAuthenticated(true);
      setUserType(type);
      setRoleName(usuario.role_name || null);
      setLoggedUserName(usuario.nombre_completo || resolvedUsername);
      setLoggedUserId(usuario.id);
      setUsername(resolvedUsername);
      setMustChangePassword(mustChange);
      storePermissions(nextPermissions);
      setPermissionsLoading(false);

      sessionStorage.setItem('user', JSON.stringify(usuario));
      sessionStorage.setItem('userType', type);
      sessionStorage.setItem('roleName', usuario.role_name || '');
      sessionStorage.setItem('loggedUserName', usuario.nombre_completo || resolvedUsername);
      sessionStorage.setItem('loggedUserId', usuario.id);
      sessionStorage.setItem('username', resolvedUsername);
      sessionStorage.setItem('mustChangePassword', String(mustChange));
      sessionStorage.setItem('permissions', JSON.stringify(nextPermissions));

      return { success: true, userType: type, mustChangePassword: mustChange };
    } catch (error) {
      console.error('Error al almacenar los datos del usuario en sessionStorage: ', error);
      logout();

      if (error.response?.status === 429) {
        throw new Error('Demasiados intentos fallidos. Por favor, inténtalo de nuevo más tarde.');
      }

      if (error.response?.status === 401) {
        throw new Error('Credenciales inválidas. Por favor, verifica tus datos.');
      }

      throw new Error(error.response?.data?.error || 'Error desconocido al iniciar sesión');
    }
  };

  const setAuthData = (data) => {
    const nextMustChangePassword = Boolean(data.mustChangePassword);
    const nextPermissions = normalizePermissionCodes(
      Array.isArray(data.permissions) ? data.permissions : []
    );
    const nextRoleName = data.user?.role_name || data.roleName || null;

    setIsAuthenticated(true);
    setUserType(data.userType);
    setRoleName(nextRoleName);
    setLoggedUserName(data.loggedUserName);
    setLoggedUserId(data.user ? data.user.id : null);
    setMustChangePassword(nextMustChangePassword);
    storePermissions(nextPermissions);
    setPermissionsLoading(false);

    sessionStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('userType', data.userType);
    sessionStorage.setItem('roleName', nextRoleName || '');
    sessionStorage.setItem('loggedUserName', data.loggedUserName);
    sessionStorage.setItem('loggedUserId', data.user ? data.user.id : null);
    sessionStorage.setItem('mustChangePassword', String(nextMustChangePassword));
    sessionStorage.setItem('permissions', JSON.stringify(nextPermissions));

    if (data.username) {
      setUsername(data.username);
      sessionStorage.setItem('username', data.username);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setRoleName(null);
    setLoggedUserName(null);
    setLoggedUserId(null);
    setUsername(null);
    setMustChangePassword(false);
    setPermissions([]);
    setPermissionsLoading(false);

    sessionStorage.clear();
    localStorage.removeItem('token');
  };

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      userType,
      roleName,
      loggedUserName,
      loggedUserId,
      username,
      mustChangePassword,
      permissions,
      permissionsLoading,
      hasPermission: (permissionCode) => hasPermissionCode(permissionCode, permissions),
      hasAnyPermission: (permissionCodes = []) =>
        permissionCodes.some((permissionCode) => hasPermissionCode(permissionCode, permissions)),
      loading,
      login,
      logout,
      setAuthData,
    }),
    [
      isAuthenticated,
      userType,
      roleName,
      loggedUserName,
      loggedUserId,
      username,
      mustChangePassword,
      permissions,
      permissionsLoading,
      loading,
      login,
      logout,
      setAuthData,
    ]
  );
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export { AuthContext };
