// requirePasswordChange.js

const requirePasswordChange = (req, res, next) => {
  if (!req.user?.mustChangePassword) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Debes cambiar tu contraseña antes de continuar',
    code: 'PASSWORD_CHANGE_REQUIRED',
  });
};

export default requirePasswordChange;
