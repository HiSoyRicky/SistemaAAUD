// server/routes/inciden/getPublicIncident.js
const express = require('express');
const router = express.Router();
const { getIncidentByToken } = require('../../utils/token');

// Endpoint para obtener incidencia pública por token
router.get('/public/:token', async (req, res, next) => {
    const { token } = req.params;

    try {
        const incident = await getIncidentByToken(token);

        if (!incident) {
            return res.status(404).json({
                success: false,
                code: 'INVALID_TOKEN',
                message: 'Token inválido o expirado. Solicita un nuevo enlace.',
                data: null
            });
        }
        res.json({ success: true, data: incident });
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({
                success: false,
                code: 'INVALID_TOKEN',
                message: 'El enlace de la incidencia no es válido o ha caducado.',
                data: null
            });
        }
        next(err);
    }
});

module.exports = router;