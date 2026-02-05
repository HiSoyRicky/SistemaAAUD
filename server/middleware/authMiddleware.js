// authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ success: false, message: "No autorizado: falta token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        console.log("JWT VERIFY ERROR =>", err.message);
        return res.status(403).json({ success: false, message: "Token inválido o expirado" });
    }
};

module.exports = authMiddleware;
