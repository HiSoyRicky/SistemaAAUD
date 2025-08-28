// server/routes/inciden/getPublicIncident.js
const express = require('express');
const router = express.Router();
const { getIncidentByToken } = require('../../utils/token');
const AppError = require('../../utils/AppError');

// Endpoint para obtener incidencia pública por token
router.get('/public/:token', async (req, res, next) => {
    const { token } = req.params;

    try {
        const incident = await getIncidentByToken(token);
        if (!incident) {
            throw new AppError(
                'Token inválido o expirado',
                404,
                'INVALID_TOKEN',
                { help: 'Solicita un nuevo enlace o verifica que no haya caducado' }
            );
        }
        res.json({ success: true, data: incident });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            err.status = 400;
            err.message = 'El enlace de la incidencia no es válido o ha caducado.';
            err.code = 'INVALID_TOKEN';
        }
        next(err);
    }
});

module.exports = router;