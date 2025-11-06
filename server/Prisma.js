// server/Prisma.js
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || process.env.DOCKER_DATABASE_URL,
        },
    },
});

module.exports = { prisma };
