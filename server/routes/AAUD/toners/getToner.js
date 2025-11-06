// server/routes/toners.js
const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const catchAsync = require("../../../utils/catchAsync");

//  Obtener todos los tóners con modelo, color y stock
router.get("/", catchAsync(async (req, res) => {
        const result = await prisma.toners.findMany({
                select: {
                        id: true,
                },
                orderBy: { id: 'asc' }
        });
        res.json(result);

}
));

module.exports = router;
