// IncidentForm.jsx

import { useEffect, useState } from 'react';
import UbiDepSelector from '../../../../shared/common/UbiDepSelector';
import ModalLayer from '../../../../shared/components/ui/ModalLayer';
import useAuth from '../../../../shared/hooks/useAuth';
import { useIncidentForm } from '../../hooks/useIncidentForm';
import { Incidents } from '../../services/incidents.api';
import { getCurrentPrinterLevels } from '../../utils/tonerForm';

const COLOR_LABELS = { BLACK: 'Negro', CYAN: 'Cian', MAGENTA: 'Magenta', YELLOW: 'Amarillo' };

function PrinterTonerLevels({ ubicationId, departmentId, modelId, availableTonerColors, onChooseModel, onChoosePrinter, onSuggest, onResetSuggestion }) {
  const [printers, setPrinters] = useState([]);
  const [printerId, setPrinterId] = useState('');
  const [loadingPrinters, setLoadingPrinters] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [levels, setLevels] = useState(null);
  const [error, setError] = useState('');
  const matchingPrinters = printers.filter((printer) => String(printer.id_printer_model) === String(modelId));
  const activeLevels = getCurrentPrinterLevels(levels, printerId, modelId);

  useEffect(() => {
    let cancelled = false;
    const params = { id_ubication: ubicationId, id_department: departmentId };
    setLoadingPrinters(true);
    Incidents.fetchTonerPrinters(params)
      .then((result) => {
        if (cancelled) return;
        const list = Array.isArray(result) ? result : [];
        setPrinters(list);
        if (list.length === 1) {
          setPrinterId(String(list[0].id));
          onChooseModel(list[0].id_printer_model);
        }
      })
      .catch(() => { if (!cancelled) setError('No se pudo cargar el estado de las impresoras. Puedes seleccionar el color manualmente.'); })
      .finally(() => { if (!cancelled) setLoadingPrinters(false); });
    return () => { cancelled = true; };
  }, [ubicationId, departmentId]);

  useEffect(() => {
    const matches = printers.filter((printer) => String(printer.id_printer_model) === String(modelId));
    setPrinterId((current) => {
      if (matches.length === 1) return String(matches[0].id);
      return matches.some((printer) => String(printer.id) === current) ? current : '';
    });
  }, [printers, modelId]);

  useEffect(() => {
    const printer = printers.find((item) => String(item.id) === printerId && String(item.id_printer_model) === String(modelId));
    onChoosePrinter(printer ? printerId : '');
  }, [printers, printerId, modelId]);

  useEffect(() => {
    const printer = printers.find((item) => String(item.id) === printerId);
    if (!printer?.available || String(printer.id_printer_model) !== String(modelId)) { setLevels(null); setLoadingLevels(false); return undefined; }
    let cancelled = false;
    setLevels(null);
    setError('');
    setLoadingLevels(true);
    Incidents.fetchTonerLevels(printerId, { id_ubication: ubicationId, id_department: departmentId, id_printer_model: modelId })
      .then((result) => {
        if (cancelled) return;
        setLevels({ printerId, modelId: String(modelId), data: result });
      })
      .catch(() => { if (!cancelled) setError('No fue posible consultar la impresora. Puedes seleccionar el color manualmente.'); })
      .finally(() => { if (!cancelled) setLoadingLevels(false); });
    return () => { cancelled = true; };
  }, [printerId, ubicationId, departmentId, modelId, printers]);

  useEffect(() => {
    if (activeLevels?.status !== 'ok' || !availableTonerColors.length) return;
    const lowest = (activeLevels.supplies || [])
      .filter((supply) => Number.isFinite(supply.percent) && supply.percent >= 0 && supply.percent < 10 && availableTonerColors.some((toner) => toner.color === supply.color))
      .sort((a, b) => a.percent - b.percent)[0];
    if (lowest) onSuggest(lowest);
  }, [activeLevels, availableTonerColors]);

  return (
    <div className="rounded-lg border border-blue-100 bg-white p-4">
      {matchingPrinters.length > 1 && <><label htmlFor="physical-printer" className="block text-sm font-medium text-gray-700">Hay varias impresoras de este modelo. Seleccione el equipo que necesita</label>
      <select id="physical-printer" value={printerId} onChange={(event) => { const id = event.target.value; const printer = printers.find((item) => String(item.id) === id); onResetSuggestion(); setPrinterId(id); if (printer) onChooseModel(printer.id_printer_model); }} disabled={loadingPrinters} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-gray-100">
        <option value="">-- Seleccione el equipo por marbete --</option>
        {matchingPrinters.map((printer) => <option key={printer.id} value={printer.id}>{printer.description ? `${printer.description} · ` : ''}Marbete: {printer.tag || `Equipo ${printer.id}`}{printer.available ? '' : ' (sin IP disponible)'}</option>)}
      </select></>}
      <div aria-live="polite" className="mt-2 text-xs text-slate-600">
        {loadingPrinters && 'Cargando equipos...'}
        {!loadingPrinters && printers.length === 0 && !error && 'No hay equipos disponibles para consultar. Puedes seleccionar el color manualmente.'}
        {!loadingPrinters && modelId && matchingPrinters.length === 0 && printers.length > 0 && 'No hay equipos de este modelo disponibles para consultar. Puedes seleccionar el color manualmente.'}
        {!loadingPrinters && printerId && !printers.find((printer) => String(printer.id) === printerId)?.available && 'La impresora no tiene IP disponible. Puedes seleccionar el color manualmente.'}
        {loadingLevels && 'Consultando niveles de tóner...'}
        {error && <p className="text-amber-700">{error}</p>}
        {activeLevels?.status === 'unavailable' && <p className="text-amber-700">Estado no disponible. Puedes seleccionar el color manualmente.</p>}
        {activeLevels?.status === 'ok' && (
          <div>
            <p>Última lectura: {activeLevels.checked_at ? new Date(activeLevels.checked_at).toLocaleString('es-PA') : 'hora no disponible'}. Los niveles son orientativos.</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {(activeLevels.supplies || []).filter((supply) => COLOR_LABELS[supply.color]).sort((a, b) => (Number.isFinite(a.percent) ? a.percent : Infinity) - (Number.isFinite(b.percent) ? b.percent : Infinity)).map((supply, index) => {
                const empty = supply.percent === 0;
                const low = Number.isFinite(supply.percent) && supply.percent > 0 && supply.percent < 10;
                const large = Number.isFinite(supply.percent) && supply.percent <= 50;
                return (
                  <li key={`${supply.color}-${supply.model || index}`} className={`rounded-lg border ${empty ? 'border-red-300 bg-red-50 p-4' : low ? 'border-amber-300 bg-amber-50 p-4' : 'border-slate-200 bg-white px-3 py-2'} ${large ? 'sm:col-span-2 text-base' : 'text-xs'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-900">{COLOR_LABELS[supply.color]} {supply.model ? `(${supply.model})` : ''}</span><span className={`font-bold ${empty ? 'text-red-800' : low ? 'text-amber-800' : 'text-slate-700'} ${large ? 'text-xl' : 'text-sm'}`}>{Number.isFinite(supply.percent) ? `${supply.percent}%` : 'Nivel desconocido'}</span></div>
                    {empty && <p className="mt-1 font-bold text-red-800">Tóner agotado</p>}
                    {low && <p className="mt-1 font-bold text-amber-800">Alerta: tóner acabándose</p>}
                  </li>
                );
              })}
            </ul>
            {!(activeLevels.supplies || []).some((supply) => COLOR_LABELS[supply.color]) && <p className="mt-2">La impresora no informó niveles de color reconocibles. Puedes seleccionar el color manualmente.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function IncidentForm({ onSubmit }) {
  const { logout } = useAuth();
  const [suggestion, setSuggestion] = useState(null);

  const {
    register,
    submit,
    errors,
    isSubmitting,
    watch,
    setValue,
    showModal,
    incidentId,
    categories,
    isLoadingCategories,
    categoriesError,
    isTonerCategory,
    isOtherCategory,
    tonerPrinters,
    availableTonerColors,
    tonerDescription,
    isLoadingTonerOptions,
    tonerOptionsError,
    selectedUbication,
    selectedDepartment,
    newIncident,
    handleUbiDepChange,
  } = useIncidentForm({ onSubmit });

  const printerModelId = watch('id_printer_model');
  const ubicationId = watch('id_ubication');
  const departmentId = watch('id_department');
  useEffect(() => { setSuggestion(null); }, [printerModelId, ubicationId, departmentId, isTonerCategory]);

  const descriptionPlaceholder = isTonerCategory
    ? 'Se auto-completa al elegir color; puedes agregar más detalle si lo deseas.'
    : 'Describa el problema con el mayor detalle posible';
  const pendingSuggestion = isTonerCategory && suggestion?.modelId === watch('id_printer_model') && suggestion?.color === watch('toner_color');

  return (
    <section className="px-4 py-6">
      <div className="mx-auto w-full">
        <div className="bg-white border border-gray-100 shadow-md rounded-2xl">
          <form onSubmit={(event) => { if (pendingSuggestion) { event.preventDefault(); return; } submit(event); }} noValidate className="p-6 space-y-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="reporter_name"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Nombre completo:
                </label>
                <input
                  id="reporter_name"
                  type="text"
                  {...register('reporter_name')}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                  placeholder="Ingrese su nombre"
                />
                {errors.reporter_name?.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.reporter_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Correo electrónico (opcional):
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                  placeholder="ejemplo@aaud.gob.pa"
                />
                {errors.email?.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <input type="hidden" {...register('id_ubication')} />
            <input type="hidden" {...register('id_department')} />
            <input type="hidden" {...register('id_toner')} />
            <input type="hidden" {...register('id_printer_device')} />

            <div className="space-y-2">
              <UbiDepSelector
                id_ubication={watch('id_ubication')}
                id_department={watch('id_department')}
                onChange={handleUbiDepChange}
                errors={{
                  ubication: errors.id_ubication?.message,
                  department: errors.id_department?.message,
                }}
                mode="incident"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="id_category"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Categoría:
                </label>
                <select
                  id="id_category"
                  {...register('id_category')}
                  disabled={isLoadingCategories || categories.length === 0}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                >
                  <option value="" disabled>
                    Escoge una categoría
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {isLoadingCategories && (
                  <p className="mt-1 text-xs text-blue-600">Cargando categorías...</p>
                )}
                {categoriesError && <p className="mt-1 text-xs text-red-500">{categoriesError}</p>}
                {errors.id_category?.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.id_category.message}</p>
                )}
              </div>

              {isOtherCategory && (
                <div>
                  <label
                    htmlFor="other_category_detail"
                    className="block mb-1 text-sm font-medium text-gray-700"
                  >
                    Especifique otra categoría:
                  </label>
                  <input
                    id="other_category_detail"
                    type="text"
                    {...register('other_category_detail')}
                    className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                    placeholder="Ej: Problema con la impresora"
                  />
                  {errors.other_category_detail?.message && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.other_category_detail.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {isTonerCategory && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Solicitud de tóner</h3>
                  <p className="mt-1 text-xs text-blue-800/80">
                    Consulta los niveles de la impresora antes de elegir el color. La descripción se completará automáticamente.
                  </p>
                </div>

                {isLoadingTonerOptions && (
                  <p className="text-xs text-blue-700">Cargando impresoras disponibles...</p>
                )}

                {tonerOptionsError && <p className="text-xs text-red-600">{tonerOptionsError}</p>}

                  <div>
                    <label
                      htmlFor="id_printer_model"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Impresora:
                    </label>
                    <select
                      id="id_printer_model"
                      {...register('id_printer_model')}
                      disabled={isLoadingTonerOptions || tonerPrinters.length === 0}
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                    >
                      <option value="" disabled>
                        -- Seleccione una impresora --
                      </option>
                      {tonerPrinters.map((printer) => (
                        <option key={printer.id_printer_model} value={printer.id_printer_model}>
                          {`${printer.brand || 'Sin marca'} / ${printer.printer_model}`}
                        </option>
                      ))}
                    </select>
                    {errors.id_printer_model?.message && (
                      <p className="mt-1 text-xs text-red-500">{errors.id_printer_model.message}</p>
                    )}
                  </div>

                {watch('id_ubication') && watch('id_department') && (
                  <PrinterTonerLevels
                    key={`${watch('id_ubication')}-${watch('id_department')}`}
                    ubicationId={watch('id_ubication')}
                    departmentId={watch('id_department')}
                    modelId={watch('id_printer_model')}
                    availableTonerColors={availableTonerColors}
                    onChooseModel={(id) => setValue('id_printer_model', String(id), { shouldValidate: true, shouldDirty: true })}
                    onChoosePrinter={(id) => setValue('id_printer_device', id, { shouldDirty: true })}
                    onSuggest={(supply) => { setSuggestion({ ...supply, modelId: watch('id_printer_model') }); setValue('toner_color', supply.color, { shouldValidate: true, shouldDirty: true }); }}
                    onResetSuggestion={() => { setSuggestion(null); setValue('toner_color', '', { shouldValidate: false, shouldDirty: true }); }}
                  />
                )}
                {pendingSuggestion && (
                  <div role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    <p className="font-semibold">Seleccionamos {COLOR_LABELS[suggestion.color]} ({suggestion.percent} %). ¿Es el tóner que necesitas?</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSuggestion(null)} className="rounded-md bg-blue-700 px-3 py-2 font-semibold text-white">Sí, es correcto</button>
                      <button type="button" onClick={() => { setSuggestion(null); setValue('toner_color', '', { shouldValidate: false, shouldDirty: true }); }} className="rounded-md border border-blue-300 bg-white px-3 py-2 font-semibold text-blue-800">No, elegir otro</button>
                    </div>
                  </div>
                )}
                  <div>
                    <label
                      htmlFor="toner_color"
                      className="block mb-1 text-sm font-medium text-gray-700"
                    >
                      Color del tóner:
                    </label>
                    <select
                      id="toner_color"
                      {...register('toner_color')}
                      disabled={!watch('id_printer_model') || availableTonerColors.length === 0}
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                    >
                      <option value="" disabled>
                        -- Seleccione un color --
                      </option>
                      {availableTonerColors.map((tonerColor) => (
                        <option
                          key={`${tonerColor.id_toner}-${tonerColor.color}`}
                          value={tonerColor.color}
                        >
                          {tonerColor.toner_model
                            ? `${tonerColor.label} (${tonerColor.toner_model})`
                            : tonerColor.label}
                        </option>
                      ))}
                    </select>
                    {errors.toner_color?.message && (
                      <p className="mt-1 text-xs text-red-500">{errors.toner_color.message}</p>
                    )}
                  </div>
              </div>
            )}

            <div>
              <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                {isTonerCategory ? 'Descripción de la solicitud:' : 'Descripción del problema:'}
              </label>
              {isTonerCategory && tonerDescription ? <>
                <input type="hidden" {...register('description')} />
                <input id="description" readOnly value={tonerDescription} className="w-full rounded-lg border border-gray-200 bg-slate-100 px-3 py-2 text-sm text-gray-700" />
                <label htmlFor="toner-notes" className="mt-3 block text-sm font-medium text-gray-700">Observaciones adicionales (opcional):</label>
                <textarea
                  id="toner-notes"
                  value={String(watch('description') || '').startsWith(tonerDescription) ? String(watch('description')).slice(tonerDescription.length).replace(/^\n/, '') : ''}
                  onChange={(event) => setValue('description', `${tonerDescription}${event.target.value ? `\n${event.target.value}` : ''}`, { shouldValidate: true, shouldDirty: true })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                  placeholder="Agrega información adicional si la necesitas"
                  rows={3}
                />
              </> : <textarea
                id="description"
                {...register('description')}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder={descriptionPlaceholder}
                rows={4}
              />}
              {errors.description?.message && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {errors.root?.message && <p className="text-xs text-red-500">{errors.root.message}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoadingCategories || categories.length === 0 || pendingSuggestion}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition
                  ${
                    isSubmitting || isLoadingCategories || categories.length === 0 || pendingSuggestion
                      ? 'cursor-not-allowed bg-slate-500'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isSubmitting ? 'Enviando...' : 'Reportar Incidencia'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <ModalLayer>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-center text-lg font-bold text-gray-900">Incidencia registrada</h2>
            </div>

            <div className="px-6 py-5 text-center">
              <div className="mb-3 text-4xl text-green-600">✅</div>
              <h5 className="mb-2 text-lg font-bold text-center">
                ¡Incidencia registrada con éxito!
              </h5>

              {incidentId && (
                <p className="mb-2">
                  <strong>Número de incidencia:</strong>{' '}
                  <span className="text-blue-600">#{incidentId.ticket_number}</span>
                </p>
              )}

              <p className="mb-1">
                <strong>Nombre:</strong> {watch('reporter_name') || 'N/A'}
              </p>
              <p className="mb-1">
                <strong>Ubicación:</strong> {selectedUbication}
              </p>
              <p className="mb-1">
                <strong>Departamento:</strong> {selectedDepartment}
              </p>

              <p className="mt-3 text-sm text-gray-600">
                ¿Deseas reportar otra incidencia o cerrar sesión?
              </p>
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={newIncident}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Nueva Incidencia
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
        </ModalLayer>
      )}
    </section>
  );
}

export default IncidentForm;
