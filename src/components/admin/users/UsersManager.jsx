import React, { useState, useEffect } from "react";
import UsersTable from "./UsersTable";
import UserForm from "./UsersForm";
import { Users } from "@/services/api";
import SuccessMessage from "@/components/SuccessMessage";
import Pagination from "@/components/Pagination";

export default function UsersManager() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({
        nombre_completo: "",
        username: "",
        email: "",
        password: "",
        id_rol: 1,
        active: 1
    });
    const [editing, setEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        const data = await Users.fetchAll();
        setUsers(data);
    };

    const loadRoles = async () => {
        const data = await Users.fetchRoles();
        setRoles(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editing) {
            console.log("Actualizando usuario con:", form);
            await Users.update(form);
        } else {
            console.log("Creando usuario con:", form);
            await Users.create(form);
        }
        setForm({ id: null, nombre_completo: "", username: "", email: "", password: "", id_rol: 1, active: 1 });
        setEditing(false);
        setShowForm(false);
        loadUsers();
    };

    const editUser = (user) => {
        setForm({
            id: user.id,
            nombre_completo: user.nombre_completo || "",
            username: user.username || "",
            email: user.email || "",
            password: "",
            id_rol: user.id_rol,
            active: user.active
        });
        setEditing(true);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        await Users.delete(id);
        loadUsers();
    };

    const handleResetPassword = async (user) => {
        try {
            await Users.updatePassword(user.id);
            setMessage('Contraseña reseteada correctamente');
            setMessageType('success');
        } catch (err) {
            setMessage('Error al resetear la contraseña');
            setMessageType('error');
        }
    };

    const handleCancel = () => {
        setForm({
            id: null,
            nombre_completo: "",
            username: "",
            email: "",
            password: "",
            id_rol: 1,
            active: 1
        });
        setEditing(false);
        setShowForm(false);
    };

    const sortedUsers = [...users].sort((a, b) => a.id - b.id);

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                    {showForm ? "Ocultar formulario" : "Crear nuevo usuario"}
                </button>
            </div>

            {message && (
                <SuccessMessage
                    message={message}
                    type={messageType}
                    onClose={() => setMessage('')}
                    duration={3000}
                />
            )}

            {showForm && (
                <UserForm
                    form={form}
                    setForm={setForm}
                    roles={roles}
                    handleSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            )}

            <UsersTable
                users={paginatedUsers}
                roles={roles}
                editUser={editUser}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                handleDelete={handleDelete}
                handleResetPassword={handleResetPassword}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}
