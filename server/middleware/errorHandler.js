// errorHandler.js

function errorHandler(err, req, res, next) {
    console.error(`[${new Date().toISOString()}]`, err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        code: err.code || 'SERVER_ERROR',
        details: err.details || null
    });
}

export default errorHandler;