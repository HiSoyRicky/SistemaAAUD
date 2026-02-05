const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const catchAsync = require("../../../utils/catchAsync");
const authMiddleware = require("../../../middleware/authMiddleware");
const { parseDateOnly, parseDateTime } = require("../../../utils/dateParser");

router.use(authMiddleware);

// PUT /api/documents/:id/:id_ubication/:id_department/:id_doc_type
router.put(
    "/:id/:id_ubication/:id_department/:id_doc_type",
    catchAsync(async (req, res) => {
        const id = Number(req.params.id);
        const id_ubication = Number(req.params.id_ubication);
        const id_department = Number(req.params.id_department);
        const id_doc_type = Number(req.params.id_doc_type);

        const {
            direction,
            year,
            consecutive,
            id_origin,
            sent_by,
            sent_to,
            document_date,
            received_at,
            sent_at,
            closed_at,
            subject,
            description,
            observations,
            attachment,
        } = req.body;

        const userId = req.user?.id;
        const role = req.user.role_name;
        const existing = await prisma.bd_documents.findUnique({
            where: {
                id_id_ubication_id_department_id_doc_type: {
                    id,
                    id_ubication,
                    id_department,
                    id_doc_type,
                },
            },
            select: { created_by: true },
        });

        if (!existing) return res.status(404).json({ message: "Documento no encontrado" });

        const isAdmin = role === "Administrador";
        const isOwner = existing.created_by === userId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "No puedes editar este documento" });
        }


        const updated = await prisma.bd_documents.update({
            where: {
                id_id_ubication_id_department_id_doc_type: {
                    id,
                    id_ubication,
                    id_department,
                    id_doc_type,
                },
            },
            data: {
                direction: direction ?? undefined,
                year: year !== undefined ? Number(year) : undefined,
                consecutive: consecutive !== undefined ? Number(consecutive) : undefined,

                id_origin: id_origin !== undefined ? (id_origin ? Number(id_origin) : null) : undefined,

                sent_by: sent_by !== undefined ? sent_by : undefined,
                sent_to: sent_to !== undefined ? sent_to : undefined,

                document_date: document_date !== undefined ? parseDateOnly(document_date) : undefined,
                received_at: received_at !== undefined ? parseDateTime(received_at) : undefined,
                sent_at: sent_at !== undefined ? parseDateTime(sent_at) : undefined,
                closed_at: closed_at !== undefined ? parseDateTime(closed_at) : undefined,

                subject: subject !== undefined ? subject : undefined,
                description: description !== undefined ? description : undefined,
                observations: observations !== undefined ? observations : undefined,
                attachment: attachment !== undefined ? attachment : undefined,

                updated_at: new Date(),
            },
        });

        res.json(updated);
    })
);

module.exports = router;