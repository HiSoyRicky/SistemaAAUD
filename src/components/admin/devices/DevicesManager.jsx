import React, { useEffect, useState } from "react";
import axios from "axios";
import DevicesTable from "./DevicesTable";

export default function DevicesManager() {
    const [devices, setDevices] = useState([]);
    const [newDevice, setnewDevice] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
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
        if (!newDevice.trim()) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/devices`, { name: newDevice });
            setnewDevice("");
            fetchDevices();
        }
        catch (err) {
            console.error("Error al agregar ubicación:", err);
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
            await axios.put(`${import.meta.env.VITE_API_URL}/api/devices/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchDevices();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar dispositivo:", err);
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
                setCurrentPage={setCurrentPage}
                editDevice={editDevice}
            />
        </div>            
    );
}