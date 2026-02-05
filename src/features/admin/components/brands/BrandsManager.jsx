import React, { useEffect, useState } from "react";
import axios from "axios";
import BrandsTable from "./BrandsTable";
import Pagination from "@/shared/components/ui/Pagination";

export default function BrandsManager() {
    const [brands, setbrands] = useState([]);
    const [newBrand, setnewBrand] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [message, setMessage] = useState('');
    const [SuccessMessage, setSuccessMessage] = useState('success');
    const API_URL = `/api/brands`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [search, setSearch] = useState("");

    //  Cargar dispositivos desde backend
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

    //  Agregar nueva marca
    const addBrand = async () => {
        if (!newBrand.trim()) return;
        try {
            await axios.post(`${API_URL}`, {
                name: newBrand
            });
            setnewBrand("");
            fetchbrands();
        }
        catch (err) {
            console.error("Error al agregar marca:", err);
        }
    };

    //  Iniciar edición
    const editBrand = (id, name) => {
        setEditingId(id);
        setEditingName(name);
    };

    //  Guardar edición
    const saveBrand = async (id) => {
        if (!editingName.trim()) return;
        try {
            await axios.put(`${API_URL}/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            fetchbrands();
            setSuccessMessage("Marca actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar marca:", err);
        }
    };

    useEffect(() => {
            setCurrentPage(1);
        }, [search]);

    // Filtrado por búsqueda
    const filteredBrands = brands.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const sortedBrands = [...filteredBrands].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedBrands.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBrands = sortedBrands.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gestión de Marcas</h2>
            </div>

            {message && (
                <div className="px-4 py-2 text-green-800 bg-green-100 border border-green-300 rounded">
                    {message}
                </div>
            )}

            {/* Barra de búsqueda */}
            <div className="flex gap-1 mb-4">
                <input
                    type="text"
                    placeholder="Buscar marca..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                />
            </div>

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