// authMiddleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "No autenticado"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();

    } catch (err) {

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Sesión expirada"
            });
        }

        return res.status(401).json({
            success: false,
            message: "Token inválido"
        });
    }
};

module.exports = authMiddleware;