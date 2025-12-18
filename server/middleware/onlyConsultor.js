const onlyConsultor = (req, res, next) => {
    if (!req.user || req.user.id_rol !== 3) {
        return res.status(403).json({
            success: false,
            message: 'Acceso permitido solo para consultores',
        });
    }
    next();
};

module.exports = onlyConsultor;
