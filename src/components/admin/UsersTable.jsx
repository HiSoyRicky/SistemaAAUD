// src/components/admin/UsersTable.jsx
import React from "react";
import { Edit, Trash2, Key } from "lucide-react";

export default function UsersTable({ users, roles, handleEdit, handleDelete, handleResetPassword }) {
    return (
        <table className="bg-white rounded-lg shadow-md p-1">
            <thead>
                <tr className="bg-gray-200">
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Nombre completo</th>
                    <th className="p-2 border">Usuario</th>
                    <th className="p-2 border">Correo</th>
                    <th className="p-2 border">Rol</th>
                    <th className="p-2 border">Activo</th>
                    <th className="p-2 border">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-2 border text-center">{u.id}</td>
                        <td className="p-2 border">{u.full_name}</td>
                        <td className="p-2 border">{u.username}</td>
                        <td className="p-2 border">{u.email}</td>
                        <td className="p-2 border text-center">{roles.find(r => r.id === u.id_rol)?.role_name || "Desconocido"}</td>
                        <td className="p-2 border text-center">{u.active ? "Sí" : "No"}</td>
                        <td className="p-2 border flex gap-1 justify-center">
                            <button onClick={() => handleEdit(u)} title="Editar usuario">
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
