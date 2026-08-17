// TonersForm.jsx

import { useState } from 'react';

export default function TonerForm({
  models,
  newPrinterModel,
  setNewPrinterModel,
  newTonerName,
  setNewTonerName,
  newTonerCode,
  setNewTonerCode,
  newColor,
  setNewColor,
  newMinStock,
  setNewMinStock,
  addToner,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded shadow">
      <button
        type="button"
        className="flex w-full justify-between p-3 bg-gray-100 cursor-pointer text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <h3 className="font-semibold">Crear Tóner</h3>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-2">
          <select
            value={newPrinterModel}
            onChange={(e) => setNewPrinterModel(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="">Modelo de Impresora</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nombre"
            value={newTonerName}
            onChange={(e) => setNewTonerName(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />

          <input
            type="text"
            placeholder="Código"
            value={newTonerCode}
            onChange={(e) => setNewTonerCode(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />

          <select
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="">Seleccione color</option>
            <option value="BLACK">Negro</option>
            <option value="CYAN">Cian</option>
            <option value="MAGENTA">Magenta</option>
            <option value="YELLOW">Amarillo</option>
            <option value="TRI_COLOR">Tres Colores</option>
          </select>

          <input
            type="number"
            placeholder="Stock mínimo"
            value={newMinStock}
            onChange={(e) => setNewMinStock(e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />

          <button
            type="button"
            onClick={addToner}
            className="px-3 py-1 text-white bg-green-500 rounded"
          >
            Crear
          </button>
        </div>
      )}
    </div>
  );
}
