// requireRole.js

const requireRole = (...allowedRoles) => {

  if (!allowedRoles.length) {
    throw new Error("requireRole necesita al menos un rol permitido");
  }

  const normalizedRoles = allowedRoles.map(r => r.toUpperCase());

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No autenticado"
      });
    }

    const userRole = String(req.user.role || "").toUpperCase();

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "No autorizado para esta acción"
      });
    }

    next();
  };
};

export default requireRole;