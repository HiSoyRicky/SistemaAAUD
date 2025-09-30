// src/components/admin/UsersTable.jsx
import React from "react";
import ActionButton from "@/components/ui/ActionButton";
import { set } from "zod";

export default function UsersTable({
    users,
    roles,
    editUser,
    handleResetPassword,
    currentPage = 1,
    itemsPerPage = 10,
    setCurrentPage,
    setEditing,
    setShowForm,
    showForm,
    search,
    setSearch,
    message,
    setMessage,
    messageType,
    setMessageType

}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    {showForm ? "Ocultar formulario" : "Crear nuevo usuario"}
                </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="flex mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre, usuario, correo o rol..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1); // reiniciar a página 1 al buscar
                    }}
                    className="w-full px-3 py-2 border rounded"
                />
            </div>

            {
                message && (
                    <SuccessMessage
                        message={message}
                        type={messageType}
                        onClose={() => setMessage('')}
                        duration={3000}
                    />
                )
            }


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
                            <td className="p-2 border">{roles.find(r => r.id === u.id_rol)?.name || "Desconocido"}</td>
                            <td className="p-2 text-center border">{u.active ? "Sí" : "No"}</td>
                            <td className="flex justify-center gap-1 p-2 border">
                                <ActionButton
                                    type={"edit"}
                                    title="Editar usuario"
                                    onClick={() => editUser(u)}
                                >
                                </ActionButton>
                                <ActionButton
                                    type={"reset"}
                                    title="Cambiar contraseña"
                                    onClick={() => handleResetPassword(u)}
                                >
                                </ActionButton>

                            </td>
                        </tr>
                    ))}
                </tbody>
            </table >
        </div >
    );
}
