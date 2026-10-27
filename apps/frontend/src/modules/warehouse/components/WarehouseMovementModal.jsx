import { ArrowLeft, ClipboardList, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ModalLayer from '../../../shared/components/ui/ModalLayer';
import Warehouse from '../services/warehouse.api';

const INITIAL_FORM = {
  movement_type: 'OUT',
  ubication_id: '',
  department_id: '',
  item_id: '',
  quantity: 1,
  receiver_name: '',
  reference: '',
  observation: '',
};

const MOVEMENT_LABELS = { IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste' };

export default function WarehouseMovementModal({ open, ubications, departments, loggedUserName, onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [movementError, setMovementError] = useState('');
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setForm(INITIAL_FORM);
    setSearch('');
    setItems([]);
    setSelectedItem(null);
    setSearchError('');
    setMovementError('');
    setLines([]);
    setIdempotencyKey(globalThis.crypto.randomUUID());
  }, [open]);

  useEffect(() => {
    if (!open || !search.trim() || selectedItem) {
      setItems([]);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError('');
    const timer = setTimeout(async () => {
      try {
        const result = await Warehouse.fetchItems({ search, active: true, limit: 25, ...(form.movement_type === 'OUT' ? { in_stock: true } : {}) });
        if (!cancelled) setItems((result?.data || []).filter((item) => form.movement_type !== 'OUT' || Number(item.current_stock) > 0));
      } catch (error) {
        if (!cancelled) setSearchError(error.response?.data?.message || 'No se pudo buscar el catálogo');
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, search, selectedItem, form.movement_type]);

  if (!open) return null;

  const sortedUbications = [...ubications].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const availableDepartments = departments
    .filter((department) => Number(department.id_ubication) === Number(form.ubication_id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const isOutgoing = form.movement_type === 'OUT';
  const isBatchMovement = ['IN', 'OUT'].includes(form.movement_type);

  const updateForm = (changes) => setForm((current) => ({ ...current, ...changes }));

  const next = () => {
    if (isOutgoing && (!form.ubication_id || !form.department_id)) {
      toast.error('Seleccione ubicación y departamento solicitante');
      return;
    }
    if (form.movement_type === 'IN' && !loggedUserName) {
      toast.error('No se pudo identificar al usuario de la sesión');
      return;
    }
    setStep(2);
  };

  const addLine = () => {
    if (!selectedItem || Number(form.quantity) < 1) return;
    if (!validateQuantity(selectedItem, form.quantity)) return;
    if (lines.some((line) => Number(line.item_id) === Number(selectedItem.id))) {
      toast.info('Ese insumo ya está agregado');
      return;
    }
    setLines((current) => [...current, { item_id: selectedItem.id, quantity: Number(form.quantity), item: selectedItem }]);
    updateForm({ item_id: '', quantity: 1 });
    setSelectedItem(null);
    setSearch('');
  };

  const validateQuantity = (item, quantity) => {
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      setMovementError('Indique una cantidad entera mayor que cero.');
      return false;
    }
    if (isOutgoing && Number(quantity) > Number(item.current_stock)) {
      setMovementError(`Stock insuficiente para ${item.name}. Disponible: ${item.current_stock} ${item.unit}.`);
      return false;
    }
    return true;
  };

  const goToConfirm = () => {
    const finalLines = [...lines];
    if (selectedItem) {
      if (!validateQuantity(selectedItem, form.quantity)) return;
      if (lines.some((line) => Number(line.item_id) === Number(selectedItem.id))) {
        toast.info('Ese insumo ya está agregado');
        return;
      }
      finalLines.push({ item_id: selectedItem.id, quantity: Number(form.quantity), item: selectedItem });
    }
    if (!finalLines.length) {
      toast.error('Agregue al menos un insumo');
      return;
    }
    if (form.movement_type === 'ADJUSTMENT' && finalLines.length > 1) {
      toast.error('El ajuste debe registrarse por insumo');
      return;
    }
    if (form.movement_type === 'ADJUSTMENT' && !form.reference.trim()) {
      toast.error('El motivo del ajuste es obligatorio');
      return;
    }
    if (isOutgoing && !form.receiver_name.trim()) {
      toast.error('Indique la persona que retira');
      return;
    }
    setLines(finalLines);
    updateForm({ item_id: '', quantity: 1 });
    setSelectedItem(null);
    setSearch('');
    setStep(3);
  };

  const submit = async (event) => {
    event.preventDefault();
    const finalLines = lines;
    if (!finalLines.length) {
      toast.error('Agregue al menos un insumo');
      return;
    }
    if (form.movement_type === 'ADJUSTMENT' && !form.reference.trim()) {
      toast.error('El motivo del ajuste es obligatorio');
      return;
    }

    try {
      setSaving(true);
      if (isOutgoing) {
        await Warehouse.createBatchOut({
          idempotency_key: idempotencyKey,
          ubication_id: Number(form.ubication_id),
          department_id: Number(form.department_id),
          receiver_name: form.receiver_name.trim(),
          reference: form.reference.trim() || null,
          observation: form.observation.trim() || null,
          items: finalLines.map(({ item_id, quantity }) => ({ item_id: Number(item_id), quantity })),
        });
      } else if (form.movement_type === 'IN') {
        await Warehouse.createBatchIn({
          idempotency_key: idempotencyKey,
          reference: form.reference.trim() || null,
          observation: form.observation.trim() || null,
          items: finalLines.map(({ item_id, quantity }) => ({ item_id: Number(item_id), quantity })),
        });
      } else {
        if (finalLines.length > 1) {
          toast.error('El ajuste debe registrarse por insumo');
          return;
        }
        await Warehouse.createMovement({
          idempotency_key: idempotencyKey,
          item_id: Number(finalLines[0].item_id),
          quantity: finalLines[0].quantity,
          movement_type: form.movement_type,
          receiver_name: loggedUserName,
          reference: form.reference.trim() || null,
          observation: form.observation.trim() || null,
        });
      }
      toast.success('Movimiento registrado');
      onSaved?.();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'No se pudo registrar el movimiento';
      const stockMatch = message.match(/stock institucional insuficiente para el insumo\s+(\d+)/i);
      const item = stockMatch && finalLines.find((line) => Number(line.item_id) === Number(stockMatch[1]));
      setMovementError(stockMatch ? `Stock insuficiente para ${item?.item?.name || 'el insumo seleccionado'}. Actualice la disponibilidad e intente nuevamente.` : message);
    } finally {
      setSaving(false);
    }
  };

  const details = selectedItem ? (
    <div className="mt-2 grid gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:grid-cols-2">
      <strong className="text-slate-900 sm:col-span-2">{selectedItem.name}</strong>
      <span><strong>Código:</strong> {selectedItem.code || '-'}</span>
      <span><strong>Unidad:</strong> {selectedItem.unit}</span>
      <span><strong>Disponible:</strong> {selectedItem.current_stock ?? 0}</span>
      <span><strong>Categoría:</strong> {selectedItem.category || 'Sin categoría'}</span>
    </div>
  ) : null;

  return (
    <ModalLayer>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
      <div className="relative z-10 w-full max-w-3xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white"><ClipboardList size={21} /></div><div><h2 className="text-xl font-bold text-slate-900">Registrar movimiento</h2><p className="text-sm text-slate-500">Paso {step} de 3: {step === 1 ? 'Define el movimiento' : step === 2 ? 'Agrega los insumos' : 'Confirma los datos'}</p></div></div>
          <button type="button" title="Cerrar" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        </header>
        <div className="flex gap-2 border-b border-slate-200 px-5 py-3 text-sm"><span className={`rounded-full px-3 py-1 font-semibold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>1. Movimiento</span><span className={`rounded-full px-3 py-1 font-semibold ${step === 2 ? 'bg-blue-600 text-white' : step === 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>2. Insumos</span><span className={`rounded-full px-3 py-1 font-semibold ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>3. Confirmar</span></div>
        <form onSubmit={submit} className="p-5">
          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Movimiento<select value={form.movement_type} onChange={(event) => updateForm({ movement_type: event.target.value, ubication_id: '', department_id: '' })} className="h-11 rounded-md border border-slate-300 px-3 font-normal"><option value="OUT">Salida</option><option value="IN">Entrada</option><option value="ADJUSTMENT">Ajuste</option></select></label>
              {isOutgoing ? <>
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Ubicación<select required value={form.ubication_id} onChange={(event) => updateForm({ ubication_id: event.target.value, department_id: '' })} className="h-11 rounded-md border border-slate-300 px-3 font-normal"><option value="">Seleccione</option>{sortedUbications.map((ubication) => <option key={ubication.id} value={ubication.id}>{ubication.name}</option>)}</select></label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Departamento solicitante<select required disabled={!form.ubication_id} value={form.department_id} onChange={(event) => updateForm({ department_id: event.target.value })} className="h-11 rounded-md border border-slate-300 px-3 font-normal"><option value="">{form.ubication_id ? 'Seleccione' : 'Seleccione ubicación primero'}</option>{availableDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
              </> : <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">{MOVEMENT_LABELS[form.movement_type]} automática para <strong>Almacén / Carrasquilla</strong>. El receptor será <strong>{loggedUserName || 'la sesión actual'}</strong>.</div>}
              <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold">Cancelar</button><button type="button" onClick={next} className="h-10 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white">Siguiente</button></div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><strong>{MOVEMENT_LABELS[form.movement_type]}</strong>{isOutgoing ? ` · ${ubications.find((item) => Number(item.id) === Number(form.ubication_id))?.name || ''} · ${availableDepartments.find((item) => Number(item.id) === Number(form.department_id))?.name || ''}` : ' · Almacén / Carrasquilla'}</div>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Buscar insumo por nombre o código<input value={search} onChange={(event) => { setSearch(event.target.value); setSelectedItem(null); updateForm({ item_id: '' }); }} placeholder="Ej. papel o 232141..." className="h-11 rounded-md border border-slate-300 px-3 font-normal" /></label>
              {!selectedItem && search.trim() && <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white text-sm" aria-live="polite">
                {searching ? <p className="p-3 text-slate-500">Buscando...</p> : searchError ? <p className="p-3 text-red-700">{searchError}</p> : items.length ? items.map((item) => <button type="button" key={item.id} onClick={() => { setSelectedItem(item); setSearch(item.name); updateForm({ item_id: item.id }); }} className="flex w-full justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left hover:bg-blue-50"><span>{item.code || '-'} - {item.name}</span><span className="whitespace-nowrap text-slate-600">Disponible: {item.current_stock ?? 0} {item.unit}</span></button>) : <p className="p-3 text-slate-500">{isOutgoing ? 'No se encontraron insumos disponibles.' : 'No se encontraron insumos.'}</p>}
              </div>}
              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <div>{details}</div>
                <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Cantidad<input type="number" min="1" value={form.quantity} onChange={(event) => updateForm({ quantity: event.target.value })} className="h-11 rounded-md border border-slate-300 px-3 font-normal" /></label>
              </div>
              {isBatchMovement && <button type="button" onClick={addLine} className="inline-flex h-10 items-center gap-2 rounded-md border border-blue-200 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Plus size={16} />Agregar otro insumo</button>}
              {lines.length > 0 && <div className="space-y-2 rounded-lg border border-slate-200 p-3"><p className="text-sm font-bold text-slate-800">Artículos del despacho</p>{lines.map((line) => <div key={line.item_id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0"><span>{line.item?.name} · {line.quantity} {line.item?.unit}</span><button type="button" title="Quitar" onClick={() => setLines((current) => current.filter((item) => item.item_id !== line.item_id))} className="text-red-600"><Trash2 size={16} /></button></div>)}</div>}
              {isOutgoing ? <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Persona que retira<input required value={form.receiver_name} onChange={(event) => updateForm({ receiver_name: event.target.value })} placeholder="Nombre de quien retira" className="h-11 rounded-md border border-slate-300 px-3 font-normal" /></label> : form.movement_type === 'ADJUSTMENT' ? <div className="grid gap-4 md:grid-cols-2"><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Motivo del ajuste<input required value={form.reference} onChange={(event) => updateForm({ reference: event.target.value })} className="h-11 rounded-md border border-slate-300 px-3 font-normal" /></label><label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Observación<input value={form.observation} onChange={(event) => updateForm({ observation: event.target.value })} className="h-11 rounded-md border border-slate-300 px-3 font-normal" /></label></div> : <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">Recibido por<input readOnly value={loggedUserName || ''} className="h-11 rounded-md border border-slate-300 bg-slate-100 px-3" /></label>}
              {form.movement_type !== 'ADJUSTMENT' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    Referencia (opcional)
                    <input
                      value={form.reference}
                      onChange={(event) => updateForm({ reference: event.target.value })}
                      maxLength={120}
                      className="h-11 rounded-md border border-slate-300 px-3 font-normal"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                    Observación (opcional)
                    <input
                      value={form.observation}
                      onChange={(event) => updateForm({ observation: event.target.value })}
                      maxLength={255}
                      className="h-11 rounded-md border border-slate-300 px-3 font-normal"
                    />
                  </label>
                </div>
              )}
              <div className="flex justify-between gap-2"><button type="button" onClick={() => setStep(1)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold"><ArrowLeft size={16} />Atrás</button><button type="button" onClick={goToConfirm} className="h-10 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white">Revisar y confirmar</button></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Verifique que los datos sean correctos antes de registrar el movimiento. Si algo está mal, puede regresar y corregirlo.</p>
              <div className="space-y-2 rounded-lg border border-slate-200 p-4 text-sm">
                <p><strong>Movimiento:</strong> {MOVEMENT_LABELS[form.movement_type]}</p>
                {isOutgoing ? (
                  <>
                    <p><strong>Ubicación:</strong> {ubications.find((item) => Number(item.id) === Number(form.ubication_id))?.name || '-'}</p>
                    <p><strong>Departamento solicitante:</strong> {availableDepartments.find((item) => Number(item.id) === Number(form.department_id))?.name || '-'}</p>
                    <p><strong>Persona que retira:</strong> {form.receiver_name || '-'}</p>
                  </>
                ) : form.movement_type === 'ADJUSTMENT' ? (
                  <>
                    <p><strong>Motivo del ajuste:</strong> {form.reference || '-'}</p>
                    {form.observation && <p><strong>Observación:</strong> {form.observation}</p>}
                  </>
                ) : (
                  <p><strong>Recibido por:</strong> {loggedUserName || '-'}</p>
                )}
                {form.movement_type !== 'ADJUSTMENT' && form.reference.trim() && (
                  <p><strong>Referencia:</strong> {form.reference.trim()}</p>
                )}
                {form.movement_type !== 'ADJUSTMENT' && form.observation.trim() && (
                  <p><strong>Observación:</strong> {form.observation.trim()}</p>
                )}
              </div>
              <div className="space-y-2 rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-800">Insumos a registrar</p>
                {lines.map((line) => (
                  <div key={line.item_id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <span>{line.item?.name} {line.item?.code ? `(${line.item.code})` : ''}</span>
                    <span className="font-semibold">{line.quantity} {line.item?.unit}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between gap-2">
                <button type="button" onClick={() => setStep(2)} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold"><ArrowLeft size={16} />Atrás, corregir</button>
                <button type="submit" disabled={saving} className="h-10 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando...' : `Confirmar y registrar ${MOVEMENT_LABELS[form.movement_type].toLowerCase()}`}</button>
              </div>
            </div>
          )}
        </form>
      </div>

      {movementError && <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 p-4" role="alertdialog" aria-modal="true" aria-labelledby="warehouse-movement-error"><div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"><h3 id="warehouse-movement-error" className="text-lg font-bold text-slate-900">No se pudo continuar</h3><p className="mt-2 text-sm text-slate-700">{movementError}</p><div className="mt-5 flex justify-end"><button type="button" onClick={() => setMovementError('')} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Entendido</button></div></div></div>}

    </div>
    </ModalLayer>
  );
}
