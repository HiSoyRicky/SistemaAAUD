import React, { useEffect, useState } from "react";
import axios from "axios";
import DevicesTable from "./DevicesTable";

export default function DevicesManager() {
    const [devices, setDevices] = useState([]);
    const [newDevice, setnewDevice] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/devices`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [search, setSearch] = useState("");

    //  Cargar dispositivos desde backend
    const fetchDevices = async () => {
        try {
            const res = await axios.get(API_URL);
            setDevices(res.data);
        } catch (err) {
            console.error("Error al cargar dispositivos:", err);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    //  Agregar nuevo dispositivo
    const addDevice = async () => {
        if (!newDevice) {
            setErrorMessage("Por favor completa todos los campos");
            return;
        }

        try {
            await axios.post(API_URL, { name: newDevice });
            setnewDevice("");
            fetchDevices();
            setErrorMessage("");
            setSuccessMessage("Dispositivo agregado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        }

        catch (err) {

            if (err.response) {
                const status = err.response.status;
                const message = err.response.data.message || "Error al agregar dispositivo.";

                if (status === 409) {
                    setErrorMessage("Este dispositivo ya existe.");
                } else {
                    setErrorMessage(message);
                }
            } else {
                setErrorMessage("No se pudo conectar con el servidor.");
            }

            // Borra el mensaje de error luego de unos segundos
            setTimeout(() => setErrorMessage(""), 4000);
        }
    };

    //  Iniciar edición
    const editDevice = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    //  Guardar edición
    const saveDevice = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/devices/${id}`, {
                name: editingName
            });
            setEditingId(null);
            setEditingName("");
            fetchDevices();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar dispositivo:", err);
        }
    };

    //  Eliminar dispositivo
    const deleteDevice = async (id) => {
        if (!window.confirm("¿Está seguro de que desea eliminar este dispositivo?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/devices/${id}`);
            fetchDevices();
            setSuccessMessage("Dispositivo eliminado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al eliminar dispositivo:", err);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Filtrado por búsqueda
    const filteredDevices = devices.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedDevices = [...filteredDevices].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDevices = sortedDevices.slice(startIndex, endIndex);

    return (
        <div>
            <DevicesTable
                devices={devices}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                editingId={editingId}
                editingName={editingName}
                setEditingId={setEditingId}
                setEditingName={setEditingName}
                saveDevice={saveDevice}
                totalPages={totalPages}
                search={search}
                setSearch={setSearch}
                paginatedDevices={paginatedDevices}
                newDevice={newDevice}
                setnewDevice={setnewDevice}
                addDevice={addDevice}
                successMessage={successMessage}
                errorMessage={errorMessage}
                setCurrentPage={setCurrentPage}
                editDevice={editDevice}
                deleteDevice={deleteDevice}
            />
        </div>
    );
}