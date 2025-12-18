import React from "react";
import useAuth from "@/hooks/useAuth";
import UbiDepSelector from "@/components/UbiDepSelector";
import { Modal, Button } from "react-bootstrap";
import { useIncidentForm } from "@/hooks/useIncidentForm";

function IncidentForm({ onSubmit }) {
  const { loggedUserId, logout } = useAuth();

  const {
    state,
    CATEGORY_OPTIONS,
    selectedUbication,
    selectedDepartment,
    handleChange,
    handleUbiDepChange,
    submit,
    newIncident,
  } = useIncidentForm({ loggedUserId, onSubmit });

  const { formData, errors, showModal, id_incident, isSubmitting } = state;

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
                  name="reporter_name"
                  type="text"
                  value={formData.reporter_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                  placeholder="Ingrese su nombre"
                />
                {errors.reporter_name && <p className="mt-1 text-xs text-red-500">{errors.reporter_name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                  Correo electrónico (opcional):
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                  placeholder="ejemplo@aaud.gob.pa"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <UbiDepSelector
                id_ubication={formData.id_ubication}
                id_department={formData.id_department}
                onChange={handleUbiDepChange}
                errors={{ ubication: errors.id_ubication, department: errors.id_department }}
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
                  name="id_category"
                  value={formData.id_category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                >
                  <option value="" disabled>Escoge una categoría</option>
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.id_category && <p className="mt-1 text-xs text-red-500">{errors.id_category}</p>}
              </div>

              {formData.id_category === "4" && (
                <div>
                  <label htmlFor="other_category_detail" className="block mb-1 text-sm font-medium text-gray-700">
                    Especifique otra categoría:
                  </label>
                  <input
                    id="other_category_detail"
                    name="other_category_detail"
                    type="text"
                    value={formData.other_category_detail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                    placeholder="Ej: Problema con la impresora"
                  />
                  {errors.other_category_detail && (
                    <p className="mt-1 text-xs text-red-500">{errors.other_category_detail}</p>
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
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500"
                placeholder="Describa el problema con el mayor detalle posible"
                rows={4}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            {errors.submit && <p className="text-xs text-red-500">{errors.submit}</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting} variant={isSubmitting ? "secondary" : "primary"}>
                {isSubmitting ? "Enviando..." : "Reportar Incidencia"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showModal && (
        <Modal
          show={showModal}
          onHide={() => {}}
          centered
          backdrop="static"
          keyboard={false}
        >
          <Modal.Header>
            <Modal.Title className="mx-auto">Incidencia registrada</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="text-center">
              <div className="mb-3 text-4xl text-green-600">✅</div>
              <h5 className="mb-2 font-bold text-center">¡Incidencia registrada con éxito!</h5>

              {id_incident && (
                <p className="mb-2">
                  <strong>Número de incidencia:</strong>{" "}
                  <span className="text-blue-600">#{id_incident.toString().padStart(6, "0")}</span>
                </p>
              )}

              <p className="mb-1"><strong>Nombre:</strong> {formData.reporter_name || "N/A"}</p>
              <p className="mb-1"><strong>Ubicación:</strong> {selectedUbication}</p>
              <p className="mb-1"><strong>Departamento:</strong> {selectedDepartment}</p>

              <p className="mt-3 text-gray-600 text-lm">
                ¿Deseas reportar otra incidencia o cerrar sesión?
              </p>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="primary" onClick={newIncident}>Nueva Incidencia</Button>
            <Button variant="danger" onClick={logout}>Cerrar Sesión</Button>
          </Modal.Footer>
        </Modal>
      )}
    </section>
  );
}

export default IncidentForm;
