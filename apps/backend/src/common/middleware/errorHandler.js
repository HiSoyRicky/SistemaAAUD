// errorHandler.js
function errorHandler(err, req, res, next) {

    req.log.error(
        {
            err,
            url: req.url,
            method: req.method
        },
        "Unhandled error"
    );

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Error interno del servidor",
        code: err.code || "SERVER_ERROR",
        details: err.details || null
    });
}

export default errorHandler;