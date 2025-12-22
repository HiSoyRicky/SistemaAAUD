// src/components/Pagination.jsx
import React from "react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null; // no mostrar si solo hay 1 página

    // Generar array de páginas con lógica de saltos
    const pages = [...Array(totalPages)].map((_, i) => i + 1)
        .filter((page) => {
            // Mostrar siempre primera, última y páginas cercanas a la actual
            return (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
            );
        })
        .reduce((acc, page, idx, arr) => {
            // Insertar "..." cuando haya saltos
            if (idx > 0 && page - arr[idx - 1] > 1) {
                acc.push("dots-" + idx); // identificador único para los "..."
            }
            acc.push(page);
            return acc;
        }, []);

    return (
        <div className="mt-4 flex justify-center gap-2">
            {/* Botón Anterior */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
                Anterior
            </button>

            {/* Botones de páginas */}
            {pages.map((item) =>
                typeof item === "string" && item.startsWith("dots-") ? (
                    <span key={item} className="px-2 select-none">
                        ...
                    </span>
                ) : (
                    <button
                        key={item}
                        onClick={() => onPageChange(item)}
                        className={`px-3 py-1 rounded ${currentPage === item
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        {item}
                    </button>
                )
            )}

            {/* Botón Siguiente */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
                Siguiente
            </button>
        </div>
    );
}
