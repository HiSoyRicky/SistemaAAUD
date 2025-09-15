import React, { useState, useEffect } from "react";
import axios from "axios";
import Pagination from "@/components/Pagination";
import { Edit } from "lucide-react";

export default function Brandstable({ brands, editBrand, currentPage = 1, itemsPerPage = 10 }) {
    return (
        <div>

        {/* Tabla */}
        <table className="p-1 bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
                <tr>
                    <th className="px-3 py-1 text-center border">#</th>
                    <th className="px-3 py-1 text-left border">Nombre</th>
                    <th className="px-3 py-1 text-center border">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {brands.map((u, index) => (
                    <tr key={u.id}>
                        {/* Enumeración consecutiva */}
                        <td className="text-center border -2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="p-2 border">{u.name}</td>
                        <td className="flex justify-center gap-2 px-3 py-1 text-center border">
                            {editBrand === u.id ? (
                                <button
                                    onClick={() => saveBrand(u.id)}
                                    className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                                >
                                    Guardar
                                </button>
                            ) : (
                                <button onClick={() => editBrand(u.id, u.name)} title="Editar marca">
                                    <Edit className="w-5 h-5 text-yellow-500" />
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
}