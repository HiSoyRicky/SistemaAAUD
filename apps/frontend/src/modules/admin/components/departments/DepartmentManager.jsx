// src/components/admin/DepartmentManager.jsx
import React, { useEffect, useState } from "react";
import api from "../../../../shared/api/apiClient";
import DepartmentsTable from "./DepartmentsTable";
import { Departments } from "../../../inventory/devices/services/inventory.api";

export default function DepartmentsManager() {
    const [departments, setDepartments] = useState([]);
    const [newName, setNewName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [newUbication, setNewUbication] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingUbication, setEditingUbication] = useState("");
    const [ubications, setUbications] = useState([]);
    const API_URL = `/api/departments`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    //  Cargar departamentos
    const fetchDepartments = async () => {
        try {
            const res = await api.get(API_URL);
            // Ordenar alfabéticamente por name
            const sortedDepartments = res.data.sort((a, b) =>
                a.name.localeCompare(b.name)
            );
            setDepartments(sortedDepartments);
        } catch (err) {
            console.error("Error al cargar departamentos:", err);
            setErrorMessage("Error al cargar departamentos");
        }
    };

    //  Cargar ubicaciones para los select
    const fetchUbications = async () => {
        try {
            const res = await api.get(`/api/ubications`);
            setUbications(res.data);
        } catch (err) {
            console.error("Error al cargar ubicaciones:", err);
            setErrorMessage("Error al cargar ubicaciones");
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchUbications();
    }, []);

    //  Agregar
    const addDepartment = async () => {
        if (!newName || !newUbication) {
            setErrorMessage("Por favor completa todos los campos");
            return;
        }

        try {
            await api.post(API_URL, { name: newName, id_ubication: newUbication });
            setNewName("");
            setNewUbication("");
            fetchDepartments();
            setSuccessMessage(`✅ Departamento "${newName}" creado correctamente`);
            setErrorMessage("");
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error("Error al agregar departamento:", err);
            setErrorMessage(err.response?.data?.message || "Error al crear departamento");
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };

    //  Editar
    const editDepartment = (id, name, id_ubication) => {
        setEditingId(id);
        setEditingName(name);
        setEditingUbication(id_ubication);
    };

    //  Guardar
    const saveDepartment = async (id) => {
        if (!editingName || !editingUbication) {
            setErrorMessage("Por favor completa todos los campos");
            return;
        }

        setLoading(true);
        try {
            await api.put(`${API_URL}/${id}`, { name: editingName, id_ubication: editingUbication });
            setEditingId(null);
            setEditingName("");
            setEditingUbication("");
            fetchDepartments();
            setSuccessMessage(`✅ Departamento actualizado correctamente`);
            setErrorMessage("");
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error("Error al actualizar departamento:", err);
            setErrorMessage(err.response?.data?.message || "Error al actualizar departamento");
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setLoading(false);
        }
    };

    // Eliminar
    const handleDelete = async (id, depName) => {
        const password = prompt("Para eliminar este departamento, ingresa tu contraseña:");
        if (!password) return;

        try {
            // Verificar contraseña
            await Departments.authorize(id, password);

            // Si es correcta, borrar
            await Departments.delete(id, { authorized: true });

            fetchDepartments();
            setSuccessMessage(`✅ Departamento "${depName}" eliminado correctamente`);
            setErrorMessage("");
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error("Error al eliminar departamento:", err);
            setErrorMessage(err.response?.data?.message || "Error al eliminar departamento");
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Filtrado por búsqueda
    const filteredDepartments = departments.filter((d) => {
        const term = search.toLowerCase();
        return (
            d.name?.toLowerCase().includes(term) ||
            d.ubication_name?.toLowerCase().includes(term)
        );
    });

    const sortedDepartments = [...filteredDepartments].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    const totalPages = Math.ceil(sortedDepartments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDepartments = sortedDepartments.slice(startIndex, endIndex);

    return (
        <div>

            {/* Tabla de departamentos */}
            <DepartmentsTable
                departments={departments} // Pasar todos los departamentos, no solo los paginados
                editDepartment={editDepartment}
                saveDepartment={saveDepartment}
                handleDelete={handleDelete}
                editingId={editingId}
                editingName={editingName}
                setEditingName={setEditingName}
                editingUbication={editingUbication}
                setEditingUbication={setEditingUbication}
                ubications={ubications}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                loading={loading}
                totalPages={totalPages}
                search={search}
                setSearch={setSearch}
                newName={newName}
                setNewName={setNewName}
                newUbication={newUbication}
                setNewUbication={setNewUbication}
                addDepartment={addDepartment}
                errorMessage={errorMessage}
                successMessage={successMessage}
                setCurrentPage={setCurrentPage}
                paginatedDepartments={paginatedDepartments}
            />
        </div>
    );
}
