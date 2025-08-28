// src/pages/admin/AdminUsersPage.jsx
import React, { useState, useEffect, act } from "react";
import { fetchUsers, postUser, updateUser, deleteUser, fetchRoles } from "../../services/api";
import { useNotifications } from "../../context/NotificationContext";
import UserForm from "../../components/admin/UsersForm";
import UsersTable from "../../components/admin/UsersTable";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const { addNotification } = useNotifications();
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [formVisible, setFormVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    const [form, setForm] = useState({
        full_name: "",
        username: "",
        email: "",
        id_rol: 2,
        password: "",
        active: 1
    });

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (err) {
            console.error("Error cargando usuarios:", err);
        }
    };

    const loadRoles = async () => {
        try {
            const data = await fetchRoles();
            setRoles(data);
        } catch (err) {
            console.error("Error cargando roles:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mapear campos del formulario a los que espera SQL
        const payload = {
            id: form.id,
            nombre_completo: form.full_name,
            username: form.username,
            email: form.email,
            id_rol: form.id_rol,
            active: form.active ? 1 : 0
        };

        // Solo enviar contraseña si se ingresó
        if (form.password) {
            payload.password = form.password;
        }

        try {
            if (form.id) {
                await updateUser(payload);
            } else {
                await postUser(payload);
            }


            setForm({
                full_name: "",
                username: "",
                email: "",
                id_rol: 2,
                password: "",
                active: 1
            });
            setFormVisible(false);
            loadUsers();
        } catch (err) {
            console.error("❌ Error al actualizar usuario:", err);
        }
    };

    const handleEdit = (user) => {
        setForm({
            id: user.id,
            full_name: user.full_name,
            username: user.username,
            email: user.email || "",
            id_rol: user.id_rol,
            password: "",
            active: user.active
        });
        setFormVisible(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
            await deleteUser(id);
            loadUsers();
        }
    };

    const handleResetPassword = async (user) => {
        setResetPasswordUser(user);
        setNewPassword("");
    };

    // Filtrado por búsqueda
    const filteredUsers = users.filter(u => {
        const roleName = roles.find(r => r.id === u.id_rol)?.role_name || "";
        return (
            u.full_name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
            roleName.toLowerCase().includes(search.toLowerCase())
        );
    });

    // Paginación
    const indexOfLast = currentPage * usersPerPage;
    const indexOfFirst = indexOfLast - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Administración de Usuarios</h2>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar usuario por nombre, correo, username o rol..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <button
                onClick={() => {
                    setFormVisible(!formVisible);
                    setForm({ id: null, full_name: "", username: "", email: "", id_rol: 2, password: "", active: 1 });
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
            >
                {formVisible ? "Cancelar" : "Nuevo Usuario"}
            </button>

            {formVisible && (
                <UserForm
                    form={form}
                    setForm={setForm}
                    roles={roles}
                    handleSubmit={handleSubmit}
                    onCancel={() => setFormVisible(false)}
                />
            )}

            <UsersTable
                users={currentUsers}
                roles={roles}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleResetPassword={handleResetPassword}
            />

            {/* Paginación */}
            <div className="mt-4 flex justify-center space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`px-3 py-1 rounded ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Modal Reset Password */}
            {resetPasswordUser && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">
                            Resetear contraseña para {resetPasswordUser.full_name}
                        </h3>
                        <input
                            type="password"
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border p-2 rounded mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setResetPasswordUser(null)}
                                className="bg-gray-300 px-4 py-2 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    // Aquí iría tu lógica de reset con API
                                    addNotification("Contraseña reseteada correctamente");
                                    setResetPasswordUser(null);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}