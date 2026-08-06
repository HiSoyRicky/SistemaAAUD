import React, { useEffect, useState } from "react";
import api from "../../../../shared/api/apiClient";
import Pagination from "../../../../shared/components/ui/Pagination";
import ModelsTable from "./ModelsTable";


export default function ModelsManager() {
    const [models, setModels] = useState([]);
    const [brands, setBrands] = useState([]);
    const [devices, setDevices] = useState([]);

    const [newModel, setnewModel] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [selectedDevice, setSelectedDevice] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingBrand, setEditingBrand] = useState("");
    const [editingDevice, setEditingDevice] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [search, setSearch] = useState("");

    const API_URL = `/api/models`;

    // Cargar modelos desde backend
    const fetchModels = async () => {
        try {
            const res = await api.get(API_URL);
            setModels(res.data);
        } catch (err) {
            console.error("Error al cargar modelos:", err);
        }
    };

    const fetchDevices = async () => {
        try {
            const res = await api.get(`/api/devices`);
            setDevices(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBrands = async () => {
        try {
            const res = await api.get(`/api/brands`);
            setBrands(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchModels();
        fetchBrands();
        fetchDevices();
    }, []);

    //  Agregar nuevo modelo
    const addModel = async () => {
        if (!newModel.trim() || !selectedBrand || !selectedDevice) return;
        try {
            await api.post(`/api/models`, {
                name: newModel,
                id_brand: Number(selectedBrand),
                id_device: Number(selectedDevice)
            });
            setnewModel("");
            setSelectedBrand("");
            setSelectedDevice("");
            fetchModels();
            setErrorMessage("");
            setSuccessMessage("Modelo agregado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        }
        catch (err) {
            console.error("Error al agregar modelo:", err);
            setSuccessMessage("");
            setErrorMessage(err.response?.data?.message || "Error al agregar modelo");
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };

    // Iniciar edición
    const editModel = (model) => {
        setEditingId(model.id);
        setEditingName(model.name);
        setEditingBrand(model.brandId || model.brand_id || model.id_brand || "");
        setEditingDevice(model.deviceId || model.id_device || "");
    };

    // Guardar edición
    const saveModel = async (id) => {
        if (!editingName.trim() || !editingBrand) return;
        try {
            await api.put(`/api/models/${id}`, {
                name: editingName,
                id_brand: editingBrand,
                id_device: editingDevice
            });
            setEditingId(null);
            setEditingName("");
            setEditingBrand("");
            setEditingDevice("");
            fetchModels();
            setErrorMessage("");
            setSuccessMessage("Modelo actualizado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error:", err.response?.data || err.message);
            setSuccessMessage("");
            setErrorMessage(err.response?.data?.message || "Error al guardar modelo");
            setTimeout(() => setErrorMessage(""), 5000);
        }
    };

    const deleteModel = async (id) => {
        if (!window.confirm("¿Está seguro de que desea eliminar este modelo?")) return;
        try {
            await api.delete(`/api/models/${id}`);
            fetchModels();
            setErrorMessage("");
            setSuccessMessage("Modelo eliminado correctamente");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            console.error("Error al eliminar modelo:", err);
            setSuccessMessage("");
            setErrorMessage(err.response?.data?.message || "Error al eliminar modelo");
            setTimeout(() => setErrorMessage(""), 5000);
        }
    }

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    //  Filtrado
    const filteredModels = models.filter((m) => {
        // Intentar diferentes nombres de campo para la marca
        const brandId = m.id_brand;
        const deviceId = m.id_device;

        const brandName = brands.find((b) => b.id === brandId)?.name || "";
        const deviceName = devices.find((d) => d.id === deviceId)?.name || "";

        const term = search.toLowerCase();
        return (
            m.name.toLowerCase().includes(term) ||
            brandName.toLowerCase().includes(term) ||
            deviceName.toLowerCase().includes(term)
        );
    });

    const sortedModels = [...filteredModels].sort((a, b) => a.name.localeCompare(b.name));

    const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedModels = sortedModels.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Gestión de Modelos</h2>
            </div>

            {successMessage && (
                <div className="p-2 mb-2 text-green-800 bg-green-200 rounded">{successMessage}</div>
            )}

            {errorMessage && (
                <div className="p-2 mb-2 text-red-700 bg-red-100 border border-red-400 rounded">{errorMessage}</div>
            )}

            {/* Barra de búsqueda */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre, marca o dispositivo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded"
                />
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
                newModel={newModel}
                setnewModel={setnewModel}
                addModel={addModel}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                editModel={editModel}
                saveModel={saveModel}
                deleteModel={deleteModel}

                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
                editingDevice={editingDevice}
                setEditingDevice={setEditingDevice}
                devices={devices}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />
        </div>
    );
}
