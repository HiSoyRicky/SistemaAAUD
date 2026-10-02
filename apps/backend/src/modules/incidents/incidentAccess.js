import { hasPermissionCode } from '../../common/rbac/permissions.service.js';

export function canReadAllIncidents(permissions = []) {
  return hasPermissionCode({
    grantedCodes: permissions,
    requiredCode: 'incidents.assign',
  });
}

export function canReadIncidentManagerEvents(permissions = []) {
  return (
    hasPermissionCode({ grantedCodes: permissions, requiredCode: 'incidents.read' }) &&
    canReadAllIncidents(permissions)
  );
}

export function canAccessIncidentRoom({ permissions = [], userId, incident }) {
  if (
    !hasPermissionCode({
      grantedCodes: permissions,
      requiredCode: 'incidents.read',
    })
  ) {
    return false;
  }

  return (
    canReadAllIncidents(permissions) || Number(incident?.id_technician) === Number(userId)
  );
}