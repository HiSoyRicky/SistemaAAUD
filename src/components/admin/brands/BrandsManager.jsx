import React, { useEffect, useState } from "react";
import axios from "axios";
import BrandsTable from "./BrandsTable";
import SuccessMessage from "@/components/SuccessMessage";
import Pagination from "@/components/Pagination";

export default function BrandsManager() {
    const [brands, setbrands] = useState([]);
    const [newBrand, setnewBrand] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [message, setMessage] = useState('');
    const [SuccessMessage, setSuccessMessage] = useState('success');
    const API_URL = `${import.meta.env.VITE_API_URL}/api/brands`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const sortedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBrands = sortedBrands.slice(startIndex, endIndex);

    // 🔹 Cargar dispositivos desde backend
    const fetchbrands = async () => {
        try {
            const res = await axios.get(API_URL);
            setbrands(res.data);
        } catch (err) {
            console.error("Error al cargar dispositivos:", err);
        }
    };

    useEffect(() => {
        fetchbrands();
    }, []);

    // 🔹 Agregar nueva marca
    const addBrand = async () => {
        if (!newBrand.trim()) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/brands`, { name: newBrand });
            setnewBrand("");
            fetchbrands();
        }
        catch (err) {
            console.error("Error al agregar marca:", err);
        }
    };

    // 🔹 Iniciar edición
    const editBrand = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    // 🔹 Guardar edición
    const saveBrand = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/brands/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchbrands();
            setSuccessMessage("Marca actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar marca:", err);
        }
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gestión de Marcas</h2>
            </div>

            {message && (
                <SuccessMessage
                    message={message}
                    type={setSuccessMessage}
                    onClose={() => setMessage('')}
                    duration={3000}
                />
            )}

            <BrandsTable
                brands={paginatedBrands}
                editBrand={editBrand}
                addBrand={addBrand}
                newBrand={newBrand}
                saveBrand={saveBrand}
                editingId={editingId}
                editingName={editingName}
                setnewBrand={setnewBrand}
                setEditingName={setEditingName}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}