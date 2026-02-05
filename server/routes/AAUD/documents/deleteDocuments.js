const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const catchAsync = require("../../../utils/catchAsync");

// DELETE /api/documents/:id/:id_ubication/:id_department/:id_doc_type
router.delete(
    "/:id/:id_ubication/:id_department/:id_doc_type",
    catchAsync(async (req, res) => {
        const id = Number(req.params.id);
        const id_ubication = Number(req.params.id_ubication);
        const id_department = Number(req.params.id_department);
        const id_doc_type = Number(req.params.id_doc_type);

        await prisma.bd_documents.delete({
            where: {
                id_id_ubication_id_department_id_doc_type: {
                    id,
                    id_ubication,
                    id_department,
                    id_doc_type,
                },
            },
        });

        res.json({ message: "Documento eliminado" });
    })
);

module.exports = router;