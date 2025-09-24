// server/Prisma.js
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

module.exports = { prisma };
