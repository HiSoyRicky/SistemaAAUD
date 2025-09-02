import React, { useState, useEffect } from "react";
import UsersTable from "./UsersTable";
import UserForm from "./UsersForm";
import { fetchUsers, fetchRoles } from "../../services/api";

export default function UsersManager() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [form, setForm] = useState({ 
        full_name: "", 
        username: "", 
        email: "", 
        password: "", 
        id_rol: 1, 
        active: 1 
    });
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, []);

    const loadUsers = async () => {
        const data = await fetchUsers();
        setUsers(data);
    };

    const loadRoles = async () => {
        const data = await fetchRoles();
        setRoles(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editing) {
            await updateUser(form);
        } else {
            await createUser(form);
        }
        setForm({ full_name: "", username: "", email: "", password: "", id_rol: 1, active: 1 });
        setEditing(false);
        loadUsers();
    };

    const handleEdit = (user) => {
        setForm({ ...user, password: "" });
        setEditing(true);
    };

    const handleDelete = async (id) => {
        await deleteUser(id);
        loadUsers();
    };

    const handleResetPassword = async (user) => {
        await resetPassword(user.id);
        alert("Contraseña reseteada!");
    };

    const handleCancel = () => {
        setForm({ full_name: "", username: "", email: "", password: "", id_rol: 1, active: 1 });
        setEditing(false);
    };

    return (
        <div className="space-y-4">
            <UserForm
                form={form}
                setForm={setForm}
                roles={roles}
                handleSubmit={handleSubmit}
                onCancel={handleCancel}
            />
            <UsersTable
                users={users}
                roles={roles}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleResetPassword={handleResetPassword}
            />
        </div>
    );
}
