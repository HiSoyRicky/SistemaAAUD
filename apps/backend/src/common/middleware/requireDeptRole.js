// requireDeptRole.js

const normalize = (s) =>
  (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const requireDeptRole =
  (allowedRoles = []) =>
  (req, res, next) => {
    const roleRaw = req.ctx?.roleName ?? req.user?.role_name;
    if (!roleRaw) return res.status(401).json({ message: 'No autenticado' });

    const role = normalize(roleRaw);
    const allowed = allowedRoles.map(normalize);

    const isAdmin = role === 'administrador' || role === 'admin';
    if (isAdmin) return next();

    if (!allowed.includes(role)) {
      return res.status(403).json({
        message: 'No autorizado por rol',
        debug: { roleRaw, roleNorm: role, allowedRoles },
      });
    }

    next();
  };

export default requireDeptRole;
