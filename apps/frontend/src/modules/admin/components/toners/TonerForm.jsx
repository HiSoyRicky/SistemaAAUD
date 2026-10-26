export default function TonerForm({
  models,
  newPrinterModel,
  setNewPrinterModel,
  newTonerCode,
  setNewTonerCode,
  newColor,
  setNewColor,
  newMinStock,
  setNewMinStock,
  addToner,
}) {
  return (
    <div className="space-y-3">
      <select value={newPrinterModel} onChange={(event) => setNewPrinterModel(event.target.value)} className="w-full rounded border px-2 py-2">
        <option value="">Modelo de impresora</option>
        {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
      </select>
      <input type="text" placeholder="Modelo / código" value={newTonerCode} onChange={(event) => setNewTonerCode(event.target.value)} className="w-full rounded border px-2 py-2" />
      <select value={newColor} onChange={(event) => setNewColor(event.target.value)} className="w-full rounded border px-2 py-2">
        <option value="">Seleccione color</option>
        <option value="BLACK">Negro</option><option value="CYAN">Cian</option><option value="MAGENTA">Magenta</option><option value="YELLOW">Amarillo</option><option value="TRI_COLOR">Tres colores</option>
      </select>
      <input type="number" placeholder="Stock mínimo" value={newMinStock} onChange={(event) => setNewMinStock(event.target.value)} className="w-full rounded border px-2 py-2" />
      <div className="flex justify-end">
        <button type="button" onClick={addToner} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white">Crear tóner</button>
      </div>
    </div>
  );
}
