import React from 'react';
import useAuth from '../../../../shared/hooks/useAuth';
import UbiDepSelector from '../../../../shared/common/UbiDepSelector';
import { useIncidentForm } from '../../hooks/useIncidentForm';

function IncidentForm({ onSubmit }) {
  const { loggedUserId, logout } = useAuth();

  const {
    register,
    submit,
    errors,
    isSubmitting,
    watch,
    showModal,
    incidentId,
    categories,
    isLoadingCategories,
    categoriesError,
    isTonerCategory,
    isOtherCategory,
    tonerPrinters,
    availableTonerColors,
    isLoadingTonerOptions,
    tonerOptionsError,
    selectedUbication,
    selectedDepartment,
    newIncident,
    handleUbiDepChange,
  } = useIncidentForm({ loggedUserId, onSubmit });

  const descriptionPlaceholder = isTonerCategory
    ? 'Se autocompleta al elegir color; puedes agregar más detalle si lo deseas.'
    : 'Describa el problema con el mayor detalle posible';

  return (
    <section className="px-4 py-6">
      <div className="mx-auto w-full">
        <div className="bg-white border border-gray-100 shadow-md rounded-2xl">
          <form onSubmit={submit} noValidate className="p-6 space-y-6 md:p-8">
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
                  <p className="mt-1 text-xs text-red-500">
                    {errors.reporter_name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
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
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <input type="hidden" {...register('id_ubication')} />
            <input type="hidden" {...register('id_department')} />
            <input type="hidden" {...register('id_toner')} />

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
                  <p className="mt-1 text-xs text-blue-600">
                    Cargando categorías...
                  </p>
                )}
                {categoriesError && (
                  <p className="mt-1 text-xs text-red-500">{categoriesError}</p>
                )}
                {errors.id_category?.message && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.id_category.message}
                  </p>
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
                  <h3 className="text-sm font-semibold text-blue-900">
                    Solicitud de tóner
                  </h3>
                  <p className="mt-1 text-xs text-blue-800/80">
                    Selecciona la impresora y luego el color. La descripción se
                    completará automáticamente.
                  </p>
                </div>

                {isLoadingTonerOptions && (
                  <p className="text-xs text-blue-700">
                    Cargando impresoras disponibles...
                  </p>
                )}

                {tonerOptionsError && (
                  <p className="text-xs text-red-600">{tonerOptionsError}</p>
                )}

                <div className="grid gap-4 md:grid-cols-2">
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
                      disabled={
                        isLoadingTonerOptions || tonerPrinters.length === 0
                      }
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                    >
                      <option value="" disabled>
                        -- Seleccione una impresora --
                      </option>
                      {tonerPrinters.map((printer) => (
                        <option
                          key={printer.id_printer_model}
                          value={printer.id_printer_model}
                        >
                          {`${printer.brand || 'Sin marca'} / ${printer.printer_model}`}
                        </option>
                      ))}
                    </select>
                    {errors.id_printer_model?.message && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.id_printer_model.message}
                      </p>
                    )}
                  </div>

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
                      disabled={
                        !watch('id_printer_model') ||
                        availableTonerColors.length === 0
                      }
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
                      <p className="mt-1 text-xs text-red-500">
                        {errors.toner_color.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="description"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                {isTonerCategory
                  ? 'Descripción de la solicitud:'
                  : 'Descripción del problema:'}
              </label>
              <textarea
                id="description"
                {...register('description')}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder={descriptionPlaceholder}
                rows={4}
              />
              {errors.description?.message && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            {errors.root?.message && (
              <p className="text-xs text-red-500">{errors.root.message}</p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  isSubmitting || isLoadingCategories || categories.length === 0
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition
                  ${
                    isSubmitting ||
                    isLoadingCategories ||
                    categories.length === 0
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-center text-lg font-bold text-gray-900">
                Incidencia registrada
              </h2>
            </div>

            <div className="px-6 py-5 text-center">
              <div className="mb-3 text-4xl text-green-600">✅</div>
              <h5 className="mb-2 text-lg font-bold text-center">
                ¡Incidencia registrada con éxito!
              </h5>

              {incidentId && (
                <p className="mb-2">
                  <strong>Número de incidencia:</strong>{' '}
                  <span className="text-blue-600">
                    #{incidentId.ticket_number}
                  </span>
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
      )}
    </section>
  );
}

export default IncidentForm;
