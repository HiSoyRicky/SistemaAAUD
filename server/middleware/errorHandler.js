function errorHandler(err, req, res, next) {
    console.error(`[${new Date().toISOString()}]`, err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        code: err.code || 'SERVER_ERROR',
        details: err.details || null
    });
}

module.exports = errorHandler;