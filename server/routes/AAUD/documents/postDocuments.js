const express = require("express");
const router = express.Router();
const { prisma } = require("../../../Prisma");
const catchAsync = require("../../../utils/catchAsync");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const authMiddleware = require("../../../middleware/authMiddleware");

const { parseDateOnly, parseDateTime } = require("../../../utils/dateParser");

router.use(authMiddleware);

// POST /api/documents
router.post(
  "/",
  catchAsync(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "No autenticado" });

    // Traer ubication y department del usuario
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, id_ubication: true, id_department: true },
    });

    if (!user?.id_department || !user?.id_ubication) {
      return res.status(400).json({ message: "Tu usuario no tiene ubicación/departamento asignado" });
    }

    const {
      id_doc_type,
      direction,
      year,
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

    // Consecutivo autoincrement (por dept + tipo + año)
    const y = Number(year);
    const dept = user.id_department;
    const type = Number(id_doc_type);

    const last = await prisma.bd_documents.findFirst({
      where: { id_department: dept, id_doc_type: type, year: y },
      orderBy: { consecutive: "desc" },
      select: { consecutive: true },
    });

    const nextConsecutive = (last?.consecutive ?? 0) + 1;

    const created = await prisma.bd_documents.create({
      data: {
        id_ubication: user.id_ubication,
        id_department: dept,
        id_doc_type: type,

        direction,
        year: y,
        consecutive: nextConsecutive,

        id_origin: id_origin ? Number(id_origin) : null,
        sent_by: sent_by ?? null,
        sent_to: sent_to ?? null,

        document_date: parseDateOnly(document_date),
        received_at: parseDateTime(received_at),
        sent_at: parseDateTime(sent_at),
        closed_at: parseDateTime(closed_at),

        subject: subject ?? null,
        description: description ?? null,
        observations: observations ?? null,
        attachment: attachment ?? null,

        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.status(201).json(created);
  })
);


const uploadDir = path.join(__dirname, "../../../public/uploads/documents");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Solo PDF"));
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/upload", upload.single("file"), (req, res) => {
  const filename = req.file.filename;
  const url = `/uploads/documents/${filename}`;
  res.json({ filename, url });
});




module.exports = router;
