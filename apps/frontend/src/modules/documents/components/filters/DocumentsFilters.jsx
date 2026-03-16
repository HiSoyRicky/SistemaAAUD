// DocumentsFilters.jsx
import React from "react";

export default function DocumentsFilters({
    q,
    setQ,
    years,
    fYear,
    setFYear,
    fDirection,
    setFDirection,
    docTypes,
    fDocType,
    setFDocType,
    entities,
    fOrigin,
    setFOrigin,
    onClear,
}) {
    return (
        <div className="p-4 bg-white border rounded-2xl">
            <div className="grid gap-3 md:grid-cols-5">
                <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700">Buscar</label>
                    <input
                        className="w-full p-2 border rounded-lg"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Asunto, descripción, observaciones, tipo, entidad..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-700">Año</label>
                    <select className="w-full p-2 border rounded-lg" value={fYear} onChange={(e) => setFYear(e.target.value)}>
                        <option value="">Todos</option>
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-700">Dirección</label>
                    <select className="w-full p-2 border rounded-lg" value={fDirection} onChange={(e) => setFDirection(e.target.value)}>
                        <option value="">Todas</option>
                        <option value="ENTRADA">ENTRADA</option>
                        <option value="SALIDA">SALIDA</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-700">Tipo</label>
                    <select className="w-full p-2 border rounded-lg" value={fDocType} onChange={(e) => setFDocType(e.target.value)}>
                        <option value="">Todos</option>
                        {docTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700">Entidad externa</label>
                    <select className="w-full p-2 border rounded-lg" value={fOrigin} onChange={(e) => setFOrigin(e.target.value)}>
                        <option value="">Todas</option>
                        {entities.map((x) => (
                            <option key={x.id} value={x.id}>
                                {x.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end gap-2">
                    <button type="button" className="w-full px-3 py-2 text-sm border rounded-lg hover:bg-gray-50" onClick={onClear}>
                        Limpiar
                    </button>
                </div>
            </div>
        </div>
    );
}
