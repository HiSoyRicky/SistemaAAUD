import React, { useEffect, useState } from "react";
import axios from "axios";
import Pagination from "@/components/Pagination";
import ModelsTable from "./ModelsTable";

export default function ModelsManager() {
    const [models, setModels] = useState([]);
    const [brands, setBrands] = useState([]);
    const [newModel, setnewModel] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingBrand, setEditingBrand] = useState("");
    const API_URL = `${import.meta.env.VITE_API_URL}/api/models`;
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const sortedModels = [...models].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedModels = sortedModels.slice(startIndex, endIndex);

    // 🔹 Cargar dispositivos desde backend
    const fetchModels = async () => {
        try {
            const res = await axios.get(API_URL);
            setModels(res.data);
        } catch (err) {
            console.error("Error al cargar dispositivos:", err);
        }
    };

    const fetchBrands = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/brands`);
            setBrands(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchModels();
        fetchBrands();
    }, []);

    // 🔹 Agregar nueva marca
    const addModel = async () => {
        if (!newModel.trim() || !selectedBrand) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/models`, { name: newModel });
            setnewModel("");
            setSelectedBrand("");
            fetchModels();
        }
        catch (err) {
            console.error("Error al agregar marca:", err);
        }
    };

    // 🔹 Iniciar edición
    const editModel = (id, name) => {
        setEditingId(id);
        setEditingName(name);
        setEditingBrand(id_brand);
    };

    // 🔹 Guardar edición
    const saveModel = async (id) => {
        if (!editingName.trim() || !editingBrand) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/models/${id}`, { name: editingName });
            setEditingId(null);
            setEditingName("");
            setEditingBrand("");
            fetchModels();
            setSuccessMessage("Ubicación actualizada correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al guardar dispositivo:", err);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gestión de Modelos</h2>
            </div>

            <ModelsTable
                models={paginatedModels}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                brands={brands}
                editingId={editingId}
                editingName={editingName}
                editingBrand={editingBrand}
                setEditingName={setEditingName}
                setEditingBrand={setEditingBrand}
                editModel={editModel}
                saveModel={saveModel}
            />


            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}