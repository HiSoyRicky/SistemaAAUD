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

function normalizePermissionCode(code) {
  return String(code || '').trim().toLowerCase();
}

function normalizePermissionCodes(codes = []) {
  return [...new Set(codes.map((code) => normalizePermissionCode(code)).filter(Boolean))];
}

function hasPermissionCode(grantedPermissions = [], requiredPermission) {
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

  return (
    granted.has(required) ||
    granted.has(`${module}.*`) ||
    granted.has(`*.${action}`)
  );
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loggedUserName, setLoggedUserName] = useState(null);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const storedUserType = sessionStorage.getItem('userType');
    const storedUserName = sessionStorage.getItem('loggedUserName');
    const storedUserId = sessionStorage.getItem('loggedUserId');
    const storedUsername = sessionStorage.getItem('username');
    const storedMustChangePassword = sessionStorage.getItem('mustChangePassword');
    const storedPermissions = sessionStorage.getItem('permissions');
    let parsedStoredPermissions = [];

    if (storedPermissions) {
      try {
        parsedStoredPermissions = JSON.parse(storedPermissions);
      } catch (_error) {
        parsedStoredPermissions = [];
      }
    }

    if (token && storedUserType && storedUserName && storedUserId) {
      let fallbackPermissions = parsedStoredPermissions;

      if (!fallbackPermissions.length) {
        try {
          const decoded = jwtDecode(token);
          fallbackPermissions = Array.isArray(decoded.permissions)
            ? decoded.permissions
            : [];
        } catch (_error) {
          fallbackPermissions = [];
        }
      }

      setIsAuthenticated(true);
      setUserType(storedUserType);
      setLoggedUserName(storedUserName);
      setLoggedUserId(storedUserId);
      setUsername(storedUsername);
      setMustChangePassword(storedMustChangePassword === 'true');
      setPermissions(normalizePermissionCodes(fallbackPermissions));
    }
    else if (token) {
      try {
        const decoded = jwtDecode(token);

        const type = resolveUserType({
          roleId: decoded.roleId ?? decoded.id_rol ?? decoded.role,
          roleName: decoded.role
        });
        const decodedMustChange = Boolean(decoded.mustChangePassword);
        const decodedPermissions = normalizePermissionCodes(
          Array.isArray(decoded.permissions) ? decoded.permissions : []
        );

        setIsAuthenticated(true);
        setUserType(type);
        setLoggedUserName(decoded.nombre_completo || decoded.username);
        setLoggedUserId(decoded.id);
        setUsername(decoded.username);
        setMustChangePassword(decodedMustChange);
        setPermissions(decodedPermissions);

        sessionStorage.setItem('userType', type);
        sessionStorage.setItem('loggedUserName', decoded.nombre_completo || decoded.username || '');
        sessionStorage.setItem('loggedUserId', decoded.id);
        sessionStorage.setItem('username', decoded.username || '');
        sessionStorage.setItem('mustChangePassword', String(decodedMustChange));
        sessionStorage.setItem('permissions', JSON.stringify(decodedPermissions));

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
      const nextPermissions = normalizePermissionCodes(
        Array.isArray(usuario?.permissions) ? usuario.permissions : []
      );

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
      setPermissions(nextPermissions);

      sessionStorage.setItem('user', JSON.stringify(usuario));
      sessionStorage.setItem('userType', type);
      sessionStorage.setItem('loggedUserName', usuario.nombre_completo || resolvedUsername);
      sessionStorage.setItem('loggedUserId', usuario.id);
      sessionStorage.setItem('username', resolvedUsername);
      sessionStorage.setItem('mustChangePassword', String(mustChange));
      sessionStorage.setItem('permissions', JSON.stringify(nextPermissions));

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
    const nextPermissions = normalizePermissionCodes(
      Array.isArray(data.permissions) ? data.permissions : []
    );
    setIsAuthenticated(true);
    setUserType(data.userType);
    setLoggedUserName(data.loggedUserName);
    setLoggedUserId(data.user ? data.user.id : null);
    setMustChangePassword(nextMustChangePassword);
    setPermissions(nextPermissions);

    sessionStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('userType', data.userType);
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
    setLoggedUserName(null);
    setLoggedUserId(null);
    setUsername(null);
    setMustChangePassword(false);
    setPermissions([]);

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
        permissions,
        hasPermission: (permissionCode) =>
          hasPermissionCode(permissions, permissionCode),
        hasAnyPermission: (permissionCodes = []) =>
          permissionCodes.some((permissionCode) =>
            hasPermissionCode(permissions, permissionCode)
          ),
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


