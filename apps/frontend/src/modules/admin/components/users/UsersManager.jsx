import React, { useState, useEffect } from "react";
import UsersTable from "./UsersTable";
import UserForm from "./UsersForm";
import { Users } from "../../../inventory/devices/services/inventory.api";
import Pagination from "../../../../shared/components/ui/Pagination";

export default function UsersManager() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({
        id: null,
        nombre_completo: "",
        username: "",
        email: "",
        password: "",
        id_department: "",
        id_rol: 1,
        active: true
    });
    const [editing, setEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [SuccessMessage, setSuccessMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
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

        const basePayload = {
            nombre_completo: form.nombre_completo,
            username: form.username,
            email: form.email || null,
            id_rol: Number(form.id_rol),
            active: Boolean(form.active),
            id_department: form.id_department
                ? Number(form.id_department)
                : null,
        };

        try {
            if (editing) {
                console.log("Actualizando usuario con:", basePayload);
                await Users.update({ ...basePayload, id: form.id });
            } else {
                const createPayload = {
                    ...basePayload,
                    password: String(form.password || "").trim(),
                };

                console.log("Creando usuario con:", createPayload);
                await Users.create(createPayload);
            }
        } catch (error) {
            console.log("ERROR BACKEND:", error.response?.data);
            return;
        }

        // reset
        setForm({
            id: null,
            nombre_completo: "",
            username: "",
            id_department: "",
            email: "",
            password: "",
            id_rol: 1,
            active: true
        });

        setEditing(false);
        setShowForm(false);
        loadUsers();
    };

    const editUser = (user) => {
        setForm({
            id: user.id,
            nombre_completo: user.nombre_completo || "",
            username: user.username || "",
            id_department: user.id_department || "",
            email: user.email || "",
            password: "",
            id_rol: user.id_rol || 1,
            active: Boolean(user.active),
        });
        setEditing(true);
        setShowForm(true);
    };

    const handleResetPassword = async (user) => {
        const genericPassword = prompt(
            `Contraseña genérica temporal para ${user.username}:`,
            "aaud.123456"
        );
        if (!genericPassword) return;

        try {
            await Users.updatePassword(user.id, genericPassword, {
                requirePasswordChange: true,
            });
            setMessage('Contraseña reseteada correctamente');
            setMessageType('success');
            alert(`Contraseña temporal asignada a ${user.username}: ${genericPassword}`);
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
            id_department: "",
            email: "",
            password: "",
            id_rol: 1,
            active: true
        });
        setEditing(false);
        setShowForm(false);
    };

    // Filtrado por búsqueda
    const filteredUsers = users.filter(user => {
        const roleName = roles.find(r => r.id === user.id_rol)?.name || "";
        const term = search.toLowerCase();
        return (
            user.nombre_completo?.toLowerCase().includes(term) ||
            user.username?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            roleName.toLowerCase().includes(term)
        );
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => a.id - b.id);

    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">

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
                handleResetPassword={handleResetPassword}
                setShowForm={setShowForm}
                showForm={showForm}
                setSearch={setSearch}
                search={search}
                setCurrentPage={setCurrentPage}
                message={message}
                messageType={messageType}
                setMessage={setMessage}
                setMessageType={setMessageType}
                setEditing={setEditing}
                SuccessMessage={SuccessMessage}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}
