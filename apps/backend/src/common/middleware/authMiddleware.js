// authMiddleware.js
import 'dotenv/config';
import jwt from 'jsonwebtoken';

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

        if (!decoded.id || (!decoded.role && !decoded.roleId)) {
            return res.status(401).json({
                success: false,
                message: "Token mal formado"
            });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role ?? null,
            roleId: decoded.roleId ? Number(decoded.roleId) : null,
            mustChangePassword: Boolean(decoded.mustChangePassword)
        };

        next();

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

export default authMiddleware;
