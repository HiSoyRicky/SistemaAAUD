// requirePermission.js

import { normalizePermissionCode, splitPermissionCode } from '../rbac/permissions.catalog.js';
import { getResolvedUserPermissionCodes, hasPermissionCode } from '../rbac/permissions.service.js';

function sanitizeRequiredPermissions(permissionCodes) {
  const normalized = permissionCodes.map((code) => normalizePermissionCode(code)).filter(Boolean);

  if (!normalized.length) {
    throw new Error('requirePermission necesita al menos un permiso');
  }

  normalized.forEach((code) => splitPermissionCode(code));

  return normalized;
}

function unauthorized(res) {
  return res.status(401).json({
    success: false,
    message: 'No autenticado',
  });
}

function forbidden(res, requiredPermissions) {
  return res.status(403).json({
    success: false,
    message: 'No autorizado para esta acción',
    code: 'MISSING_PERMISSION',
    requiredPermissions,
  });
}

export const requireAnyPermission = (...permissionCodes) => {
  const requiredPermissions = sanitizeRequiredPermissions(permissionCodes);

  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return unauthorized(res);
      }

      const grantedCodes = await getResolvedUserPermissionCodes(req.user);

      const hasAnyPermission = requiredPermissions.some((requiredCode) =>
        hasPermissionCode({
          grantedCodes,
          requiredCode,
        })
      );

      if (!hasAnyPermission) {
        return forbidden(res, requiredPermissions);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requireAllPermissions = (...permissionCodes) => {
  const requiredPermissions = sanitizeRequiredPermissions(permissionCodes);

  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return unauthorized(res);
      }

      const grantedCodes = await getResolvedUserPermissionCodes(req.user);

      const missingPermissions = requiredPermissions.filter(
        (requiredCode) =>
          !hasPermissionCode({
            grantedCodes,
            requiredCode,
          })
      );

      if (missingPermissions.length) {
        return forbidden(res, missingPermissions);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

const requirePermission = (...permissionCodes) => requireAnyPermission(...permissionCodes);

export default requirePermission;
