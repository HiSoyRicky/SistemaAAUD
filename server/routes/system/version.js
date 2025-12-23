const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
    try {
        const versionPath = path.join(process.cwd(), 'VERSION');
        const version = fs.readFileSync(versionPath, 'utf8').trim();

        res.json({
            name: 'Sistema AAUD',
            version,
            environment: process.env.NODE_ENV
        });
    } catch (error) {
        res.status(500).json({
            error: 'No se pudo obtener la versión',
            details: error.message
        });
    }
});

module.exports = router;