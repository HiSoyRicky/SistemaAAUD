import React from "react";
import useAuth from "@/shared/hooks/useAuth";

import IncidentForm from "@/features/incidents/components/forms/IncidentForm";
import SummaryCards from "@/features/dashboard/components/SummaryCards";
import IncidentTable from "@/features/incidents/components/tables/IncidentTable";
import ResolveIncidentModal from "@/features/incidents/components/modals/ResolveIncidentModal";
import SuccessMessage from "@/shared/common/SuccessMessage";
import IncidentEditForm from "@/features/incidents/components/forms/IncidentEditForm";
import AssignTechnicianModal from "@/features/incidents/components/modals/AssignTechnicianModal";

import useIncidentsPage from "@/features/incidents/hooks/useIncidentsPage";

function IncidentsPage() {
    const { userType, loggedUserName, loggedUserId } = useAuth();

    const {
        technicians,
        sortedIncidentsForTable,
        filteredIncidentsForTable,
        search,
        setSearch,

        showAssignModal,
        showResolveModal,
        selectedIncidentId,
        currentIncidentToResolve,
        showIncidentForm,
        incidentToEdit,
        notification,

        setShowAssignModal,
        setShowResolveModal,
        setSelectedIncidentId,
        setShowIncidentForm,
        setIncidentToEdit,
        setNotification,

        showNotification,

        handleAddIncident,
        handleOpenAssignModal,
        handleOpenResolveModal,
        confirmAssign,
        submitSolution,
        handleExportIncidents,
    } = useIncidentsPage({ userType, loggedUserName, loggedUserId });

    return (
        <div className="w-full px-2 py-1">
            {notification.message && (
                <SuccessMessage
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ message: "", type: "" })}
                />
            )}

            {["admin", "tecnico", "consultor"].includes(userType) && (
                <div className="mb-4 text-center">
                    <button
                        onClick={() => setShowIncidentForm((prev) => !prev)}
                        className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white transition
                            ${showIncidentForm ? "bg-slate-600 hover:bg-slate-700" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                            {showIncidentForm ? "Cerrar formulario" : "Reportar Nueva Incidencia"}
                    </button>
                </div>
            )}

            {userType === "trabajador" ? (
                <section className="mb-2">
                    <h2 className="mt-0 mb-2 text-center text-xl font-semibold">Reportar Nueva Incidencia</h2>
                    <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                </section>
            ) : (
                showIncidentForm && (
                    <section className="mb-2">
                        <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                    </section>
                )
            )}


            {userType && userType !== "trabajador" && (
                <section className="mb-2">
                    <SummaryCards
                        incidents={sortedIncidentsForTable}
                        userType={userType}
                        loggedUserId={parseInt(loggedUserId)}
                    />
                </section>
            )}

            {userType && userType !== "trabajador" && (
                <section>
                    <h2 className="mb-3 text-center text-2xl font-bold">Listado de Incidencias</h2>

                    {["admin", "consultor", "tecnico"].includes(userType) && (
                        <div className="mb-3 text-center">
                            <button
                                type="button"
                                onClick={handleExportIncidents}
                                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                Exportar a Excel
                            </button>
                        </div>
                    )}

                    <div className="flex justify-center mb-3">
                        <input
                            type="text"
                            placeholder="Buscar por usuario, correo, ubicación, departamento, categoría, estado o descripción…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full max-w-xl px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>

                    <div className="flex justify-center">
                        <div className="w-full">
                            <IncidentTable
                                incidents={filteredIncidentsForTable}
                                userType={userType}
                                onAssign={["admin", "consultor"].includes(userType) ? handleOpenAssignModal : null}
                                onResolve={userType === "tecnico" ? handleOpenResolveModal : null}
                                onEdit={setIncidentToEdit}
                            />
                        </div>
                    </div>
                </section>
            )}

            {incidentToEdit && incidentToEdit.id_incident ? (
                <div style={{ border: "2px solid red", padding: "10px", background: "white" }}>
                    <IncidentEditForm
                        incident={incidentToEdit}
                        onCancel={() => setIncidentToEdit(null)}
                        onSave={(updatedIncident) => {
                            setIncidentToEdit(null);
                            showNotification("Incidencia actualizada con éxito", "success");
                        }}
                    />
                </div>
            ) : (
                incidentToEdit && <div>Error: Incidencia no válida</div>
            )}

            {showAssignModal && (
                <AssignTechnicianModal
                    id_incident={selectedIncidentId}
                    technicians={technicians}
                    onClose={() => {
                        setShowAssignModal(false);
                        setSelectedIncidentId(null);
                    }}
                    onConfirm={confirmAssign}
                />
            )}

            {showResolveModal && (
                <ResolveIncidentModal
                    id_incident={currentIncidentToResolve}
                    onClose={() => setShowResolveModal(false)}
                    onConfirm={submitSolution}
                />
            )}
        </div>
    );
}

export default IncidentsPage;
