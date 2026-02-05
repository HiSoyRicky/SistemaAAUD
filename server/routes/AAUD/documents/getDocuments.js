const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const catchAsync = require("../../../utils/catchAsync");

const authMiddleware = require("../../../middleware/authMiddleware");
const requireDeptRole = require("../../../middleware/requireDeptRole");
const attachUserContext = require("../../../middleware/attachUserContext");

router.use(authMiddleware);
router.use(attachUserContext);

router.use(requireDeptRole(["Administrador", "Técnico", "Consultor"]));

router.get("/doc-types", catchAsync(async (req, res) => {
    const data = await prisma.doc_type.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
    res.json(data);
}));

router.get("/external-entities", catchAsync(async (req, res) => {
    const data = await prisma.doc_external_entities.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
    res.json(data);
}));

// GET /api/documents
router.get(
    "/",
    catchAsync(async (req, res) => {
        const { deptId, roleName } = req.ctx;
        const normalize = (s) =>
            (s ?? "")
                .toString()
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

        const isAdmin = ["administrador", "admin"].includes(normalize(roleName));

        if (!isAdmin && !deptId) {
            return res.status(403).json({ message: "Tu usuario no tiene departamento asignado" });
        }

        const where = isAdmin ? {} : { id_department: Number(deptId) };

        const documents = await prisma.bd_documents.findMany({
            where,
            select: {
                id: true,
                id_ubication: true,
                id_department: true,
                id_doc_type: true,

                direction: true,
                year: true,
                consecutive: true,
                id_origin: true,

                sent_by: true,
                sent_to: true,

                document_date: true,
                received_at: true,
                sent_at: true,
                closed_at: true,

                subject: true,
                description: true,
                observations: true,
                attachment: true,

                created_by: true,
                created_at: true,
                updated_at: true,

                ubications: { select: { name: true } },
                departments: { select: { name: true } },
                doc_type: { select: { name: true } },
                doc_external_entities: { select: { name: true } },
                users: { select: { id: true, nombre_completo: true, username: true } },
            },
            orderBy: [{ year: "desc" }, { consecutive: "desc" }],
        });

        const mapped = documents.map((d) => ({
            id: d.id,
            id_ubication: d.id_ubication,
            ubication_name: d.ubications?.name ?? null,

            id_department: d.id_department,
            department_name: d.departments?.name ?? null,

            id_doc_type: d.id_doc_type,
            doc_type_name: d.doc_type?.name ?? null,

            id_origin: d.id_origin,
            origin_name: d.doc_external_entities?.name ?? null,

            direction: d.direction,
            year: d.year,
            consecutive: d.consecutive,

            sent_by: d.sent_by,
            sent_to: d.sent_to,

            document_date: d.document_date,
            received_at: d.received_at,
            sent_at: d.sent_at,
            closed_at: d.closed_at,

            subject: d.subject,
            description: d.description,
            observations: d.observations,
            attachment: d.attachment,

            created_by: d.created_by,
            created_by_name: d.users?.nombre_completo ?? null,

            created_at: d.created_at,
            updated_at: d.updated_at,
        }));

        res.json(mapped);
    })
);

// GET /api/documents/:id/:id_ubication/:id_department/:id_doc_type
router.get(
    "/:id/:id_ubication/:id_department/:id_doc_type",
    catchAsync(async (req, res) => {
        const normalize = (s) =>
            (s ?? "")
                .toString()
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

        const { deptId, roleName } = req.ctx;
        const isAdmin = ["administrador", "admin"].includes(normalize(roleName));

        if (!isAdmin && !deptId) {
            return res.status(403).json({ message: "Tu usuario no tiene departamento asignado" });
        }

        const id = Number(req.params.id);
        const id_ubication = Number(req.params.id_ubication);
        const id_department = Number(req.params.id_department);
        const id_doc_type = Number(req.params.id_doc_type);

        const doc = await prisma.bd_documents.findUnique({
            where: {
                id_id_ubication_id_department_id_doc_type: {
                    id,
                    id_ubication,
                    id_department,
                    id_doc_type,
                },
            },
        });

        if (!doc) return res.status(404).json({ message: "Documento no encontrado" });

        // ✅ Protección real: si no es admin, solo puede ver docs de su dept
        if (!isAdmin && doc.id_department !== Number(deptId)) {
            return res.status(403).json({ message: "No tienes acceso a este documento" });
        }

        res.json(doc);
    })
);

module.exports = router;
