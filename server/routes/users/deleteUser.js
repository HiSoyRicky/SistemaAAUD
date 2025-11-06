// server/routes/usuarios/deleteUser.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../../Prisma');


// Eliminar un usuario
router.delete('/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    try {
        const deletedUser = await prisma.users.delete({
            where: { id: userId }
        });
        res.status(200).json({ message: 'Usuario eliminado correctamente', user: deletedUser });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' })
    }

});

module.exports = router;