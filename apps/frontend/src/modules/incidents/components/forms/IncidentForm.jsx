import React from "react";
import useAuth from "../../../../shared/hooks/useAuth";
import UbiDepSelector from "../../../../shared/common/UbiDepSelector";
import { useIncidentForm } from "../../hooks/useIncidentForm";

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
    selectedUbication,
    selectedDepartment,
    newIncident,
    handleUbiDepChange
  } = useIncidentForm({ loggedUserId, onSubmit });

  const CATEGORY_OPTIONS = [
    { value: 1, label: "Problemas con el internet" },
    { value: 2, label: "Problemas con el equipo" },
    { value: 3, label: "Problemas con un programa" },
    { value: 4, label: "Otro" },
  ];

  const selectedCategory = watch("id_category");

  return (
    <section className="px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-gray-100 shadow-md rounded-2xl">
          <form onSubmit={submit} noValidate className="p-6 space-y-6 md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="reporter_name" className="block mb-1 text-sm font-medium text-gray-700">
                  Nombre completo:
                </label>
                <input
                  id="reporter_name"
                  type="text"
                  {...register("reporter_name")}
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
                  {...register("email")}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                  placeholder="ejemplo@aaud.gob.pa"
                />
                {errors.email?.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <input type="hidden" {...register("id_ubication")} />
            <input type="hidden" {...register("id_department")} />

            <div className="space-y-2">
              <UbiDepSelector
                id_ubication={watch("id_ubication")}
                id_department={watch("id_department")}
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
                <label htmlFor="id_category" className="block mb-1 text-sm font-medium text-gray-700">
                  Categoría:
                </label>
                <select
                  id="id_category"
                  {...register("id_category")}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                >
                  <option value="" disabled>Escoge una categoría</option>
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.id_category?.message && (
                  <p className="mt-1 text-xs text-red-500">{errors.id_category.message}</p>
                )}
              </div>

              {Number(selectedCategory) === 4 && (
                <div>
                  <label htmlFor="other_category_detail" className="block mb-1 text-sm font-medium text-gray-700">
                    Especifique otra categoría:
                  </label>
                  <input
                    id="other_category_detail"
                    type="text"
                    {...register("other_category_detail")}
                    className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                    placeholder="Ej: Problema con la impresora"
                  />
                  {errors.other_category_detail?.message && (
                    <p className="mt-1 text-xs text-red-500">{errors.other_category_detail.message}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                Descripción del problema:
              </label>
              <textarea
                id="description"
                {...register("description")}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder="Describa el problema con el mayor detalle posible"
                rows={4}
              />
              {errors.description?.message && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {errors.root?.message && <p className="text-xs text-red-500">{errors.root.message}</p>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition
                  ${isSubmitting ? "cursor-not-allowed bg-slate-500" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {isSubmitting ? "Enviando..." : "Reportar Incidencia"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-center text-lg font-bold text-gray-900">Incidencia registrada</h2>
            </div>

            <div className="px-6 py-5 text-center">
              <div className="mb-3 text-4xl text-green-600">✅</div>
              <h5 className="mb-2 text-lg font-bold text-center">¡Incidencia registrada con éxito!</h5>

              {incidentId && (
                <p className="mb-2">
                  <strong>Número de incidencia:</strong>{" "}
                  <span className="text-blue-600">#{incidentId.ticket_number}</span>
                </p>
              )}

              <p className="mb-1"><strong>Nombre:</strong> {watch("reporter_name") || "N/A"}</p>
              <p className="mb-1"><strong>Ubicación:</strong> {selectedUbication}</p>
              <p className="mb-1"><strong>Departamento:</strong> {selectedDepartment}</p>

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
