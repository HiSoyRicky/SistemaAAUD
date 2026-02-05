// middleware/attachUserContext.js
const { prisma } = require("../Prisma");

module.exports = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "No autenticado" });

        const user = await prisma.users.findUnique({
            where: { id: Number(userId) },
            select: {
                id: true,
                id_department: true,
                id_ubication: true,
                roles: { select: { name: true } },
            },
        });

        if (!user) return res.status(401).json({ message: "Usuario no válido" });

        req.ctx = {
            userId: user.id,
            deptId: user.id_department ?? null,
            ubicationId: user.id_ubication ?? null,
            roleName: user.roles?.name ?? req.user?.role_name ?? null,
        };

        next();
    } catch (e) {
        console.error("attachUserContext error:", e);
        return res.status(500).json({ message: "Error cargando contexto de usuario" });
    }
};
