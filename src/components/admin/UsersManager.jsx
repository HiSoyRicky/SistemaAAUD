import React, { useState, useEffect } from "react";
import UsersTable from "./users/UsersTable";
import UserForm from "./users/UsersForm";
import { Users } from "../../services/api";
import SuccessMessage from "../SuccessMessage";

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
    const [messageType, setMessageType] = useState('success'); // 'success' o 'error'


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

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios</h2>
            {/* Botón para mostrar/ocultar formulario */}
            <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                {showForm ? "Ocultar formulario" : "Crear nuevo usuario"}
            </button>

            {message && (
                <SuccessMessage
                    message={message}
                    type={messageType}
                    onClose={() => setMessage('')}
                    duration={3000} // desaparece después de 3 segundos
                />
            )}

            {/* Formulario */}
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
                users={sortedUsers}
                roles={roles}
                editUser={editUser}
                handleDelete={handleDelete}
                handleResetPassword={handleResetPassword}
            />
        </div>
    );
}
