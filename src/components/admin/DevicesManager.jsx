import React, { useEffect, useState } from "react";
import axios from "axios";

export default function DevicesManager() {
    const [devices, setDevices] = useState([]);
    const [newName, setNewName] = useState("");

    const fetchDevices = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/devices`);
        setDevices(res.data);
    };

    const addDevice = async () => {
        if (!newName.trim()) return;
        await axios.post(`${import.meta.env.VITE_API_URL}/api/devices`, { name: newName });
        setNewName("");
        fetchDevices();
    };

    const deleteDevice = async (id) => {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/devices/${id}`);
        fetchDevices();
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Equipos</h2>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    className="border p-2 rounded"
                    placeholder="Nuevo equipo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <button
                    className="bg-blue-500 text-white px-3 py-2 rounded"
                    onClick={addDevice}
                >
                    Agregar
                </button>
            </div>
            <ul className="space-y-2">
                {devices.map((d) => (
                    <li
                        key={d.id}
                        className="flex justify-between items-center border-b py-1"
                    >
                        {d.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
