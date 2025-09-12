// src/components/admin/UsersTable.jsx
import React from "react";
import { Edit, Trash2, Key } from "lucide-react";

export default function UsersTable({ users, roles, editUser, handleDelete, handleResetPassword, currentPage = 1, itemsPerPage = 10 }) {
    return (
        <table className="p-1 bg-white rounded-lg shadow-md">
            <thead>
                <tr className="bg-gray-200">
                    <th className="p-2 text-center border">#</th>
                    <th className="p-2 border">Nombre completo</th>
                    <th className="p-2 border">Usuario</th>
                    <th className="p-2 border">Correo</th>
                    <th className="p-2 border">Rol</th>
                    <th className="p-2 text-center border">Activo</th>
                    <th className="p-2 text-center border">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {users.map((u, index) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                        {/* Enumeración consecutiva considerando la página */}
                        <td className="p-2 text-center border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="p-2 border">{u.nombre_completo}</td>
                        <td className="p-2 border">{u.username}</td>
                        <td className="p-2 border">{u.email}</td>
                        <td className="p-2 border">{roles.find(r => r.id === u.id_rol)?.role_name || "Desconocido"}</td>
                        <td className="p-2 text-center border">{u.active ? "Sí" : "No"}</td>
                        <td className="flex justify-center gap-1 p-2 border">
                            <button onClick={() => editUser(u)} title="Editar usuario">
                                <Edit className="w-5 h-5 text-yellow-500" />
                            </button>
                            <button onClick={() => handleDelete(u.id)} title="Eliminar usuario">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                            <button onClick={() => handleResetPassword(u)} title="Cambiar contraseña">
                                <Key className="w-5 h-5 text-purple-600" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
