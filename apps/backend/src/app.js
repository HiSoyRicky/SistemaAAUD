import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

import routes from "./modules/routes.js";
import errorHandler from "./common/middleware/errorHandler.js";
import { env } from "./config/env.js";
import { logger } from "./common/logger.js";

const app = express();

app.use(
    pinoHttp({
        logger,

        genReqId: () => crypto.randomUUID(),

        redact: [
            "req.headers.authorization",
            "req.headers.cookie"
        ],

        customLogLevel: function (req, res, err) {

            if (res.statusCode >= 500) return "error";
            if (res.statusCode >= 400) return "warn";

            return "info";
        },

        customSuccessMessage: function (req, res) {
            return `${req.method} ${req.url} completed`;
        },

        customErrorMessage: function (req, res) {
            return `${req.method} ${req.url} failed`;
        }
    })
);

app.use(helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true,
    hsts: true
}));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: "Demasiados intentos de inicio de sesión. Intente más tarde."
    }
});

app.use("/api/auth/login", loginLimiter);

app.use(cors({
    origin: [env.FRONTEND_URL]
}));

app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use("/api", routes);

app.use((req, res, next) => {
    const err = new Error("Route not found");
    err.statusCode = 404;
    next(err);
});

app.use(errorHandler);

export default app;