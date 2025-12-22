import React, { useState, useEffect } from "react";
import UsersTable from "./UsersTable";
import UserForm from "./UsersForm";
import { Users } from "@/features/inventory/services/inventory.api";
import Pagination from "@/shared/components/ui/Pagination";

export default function UsersManager() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({
        id: null,
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
            id_rol: Number(user.id_rol),
            active: Number(user.active),  
        });
        setEditing(true);
        setShowForm(true);
    };

    const handleResetPassword = async (user) => {
        const newPassword = prompt(`Nueva contraseña para ${user.username}:`);
        if (!newPassword) return;

        try {
            await Users.updatePassword(user.id, newPassword);
            setMessage('Contraseña actualizada correctamente');
            setMessageType('success');
        } catch (err) {
            setMessage('Error al actualizar la contraseña');
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
