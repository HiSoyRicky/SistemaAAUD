import pino from "pino";

export const logger = pino({
    level: "info",
    base: {
        service: "aaud-backend"
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname"
        }
    }
});