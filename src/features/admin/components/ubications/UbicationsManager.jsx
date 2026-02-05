import React, { useState, useEffect } from "react";
import axios from "axios";
import UbicationsTable from "./UbicationsTable";


export default function UbicationsManager() {
    const [ubications, setUbications] = useState([]);
    const [newUbication, setNewUbication] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [successMessage, setSuccessMessage] = useState('');
    const [message, setMessage] = useState('');
    const API_URL = `/api/ubications`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [search, setSearch] = useState("");

    //  Cargar ubicaciones desde backend
    const fetchUbications = async () => {
        try {
            const res = await axios.get(API_URL);
            setUbications(res.data);
        } catch (err) {
            console.error("Error al cargar ubicaciones:", err);
            setMessage("Error al cargar ubicaciones");
        }
    };

    useEffect(() => {
        fetchUbications();
    }, []);

    //  Agregar nueva ubicación
    const addUbication = async () => {
        if (!newUbication.trim()) return;
        try {
            await axios.post(API_URL, { name: newUbication });
            setNewUbication("");
            fetchUbications();
        } catch (err) {
            console.error("Error al agregar ubicación:", err);
        }
    };

    //  Iniciar edición
    const editUbication = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    //  Guardar edición
    const saveUbication = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${API_URL}/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchUbications();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000); // desaparece después de 3s
        } catch (err) {
            console.error("Error al actualizar ubicación:", err);
        }
    };

    useEffect(() => {
            setCurrentPage(1);
        }, [search]);

    // Filtrado por búsqueda
    const filteredUbications = ubications.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedUbications = [...filteredUbications].sort((a, b) => a.id - b.id);

    const totalPages = Math.ceil(sortedUbications.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUbications = sortedUbications.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">

            {/* Tabla */}
            <UbicationsTable
                newUbication={newUbication}
                setNewUbication={setNewUbication}
                addUbication={addUbication}
                editUbication={editUbication}
                saveUbication={saveUbication}
                editingId={editingId}
                editingName={editingName}
                setEditingName={setEditingName}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                paginatedUbications={paginatedUbications}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                successMessage={successMessage}
                search={search}
                setSearch={setSearch}
                message={message}
                setMessage={setMessage}
                setSuccessMessage={setSuccessMessage}
            />
        </div>
    );
}
