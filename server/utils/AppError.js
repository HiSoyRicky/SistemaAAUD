// server/utils/AppError.js

class AppError extends Error {
    constructor(message, status, code, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

module.exports = AppError;
