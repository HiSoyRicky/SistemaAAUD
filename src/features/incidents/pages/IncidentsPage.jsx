import React from "react";
import useAuth from "@/shared/hooks/useAuth";

import IncidentForm from "@/features/incidents/components/forms/IncidentForm";
import SummaryCards from "@/features/dashboard/components/SummaryCards";
import IncidentTable from "@/features/incidents/components/tables/IncidentTable";
import ResolveIncidentModal from "@/features/incidents/components/modals/ResolveIncidentModal";
import SuccessMessage from "@/shared/common/SuccessMessage";
import IncidentEditForm from "@/features/incidents/components/forms/IncidentEditForm";
import AssignTechnicianModal from "@/features/incidents/components/modals/AssignTechnicianModal";

import { Button, Container, Row, Col } from "react-bootstrap";
import useIncidentsPage from "@/features/incidents/hooks/useIncidentsPage";

function IncidentsPage() {
    const { userType, loggedUserName, loggedUserId } = useAuth();

    const {
        technicians,
        sortedIncidentsForTable,
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
        setCurrentIncidentToResolve,
        setShowIncidentForm,
        setIncidentToEdit,
        setNotification,

        showNotification,

        handleAddIncident,
        handleDeleteIncident,
        handleOpenAssignModal,
        handleOpenResolveModal,
        confirmAssign,
        submitSolution,
        handleExportIncidents,
    } = useIncidentsPage({ userType, loggedUserName, loggedUserId });

    return (
        <Container fluid className="p-4">
            {notification.message && (
                <SuccessMessage
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ message: "", type: "" })}
                />
            )}

            {["admin", "tecnico", "consultor"].includes(userType) && (
                <Row className="mb-4 text-center">
                    <Col>
                        <Button
                            onClick={() => setShowIncidentForm((prev) => !prev)}
                            variant={showIncidentForm ? "secondary" : "primary"}
                        >
                            {showIncidentForm ? "Cerrar formulario" : "Reportar Nueva Incidencia"}
                        </Button>
                    </Col>
                </Row>
            )}

            {userType === "trabajador" ? (
                <section className="mb-4">
                    <h2 className="mb-3 h3">Reportar Nueva Incidencia</h2>
                    <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                </section>
            ) : (
                showIncidentForm && (
                    <section className="mb-4">
                        <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
                    </section>
                )
            )}

            {userType && userType !== "trabajador" && (
                <section className="mb-4">
                    <SummaryCards
                        incidents={sortedIncidentsForTable}
                        userType={userType}
                        loggedUserId={parseInt(loggedUserId)}
                    />
                </section>
            )}

            {userType && userType !== "trabajador" && (
                <section>
                    <h2 className="mb-3 text-center h3">Listado de Incidencias</h2>

                    {["admin", "consultor", "tecnico"].includes(userType) && (
                        <div className="mb-3 text-center">
                            <Button variant="success" onClick={handleExportIncidents}>
                                Exportar a Excel
                            </Button>
                        </div>
                    )}

                    <div id="scroll-container" className="overflow-x-auto w-100">
                        <IncidentTable
                            incidents={sortedIncidentsForTable}
                            userType={userType}
                            onAssign={["admin", "consultor"].includes(userType) ? handleOpenAssignModal : null}
                            onResolve={userType === "tecnico" ? handleOpenResolveModal : null}
                            onDelete={userType === "admin" ? handleDeleteIncident : null}
                            onEdit={setIncidentToEdit}
                        />
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
        </Container>
    );
}

export default IncidentsPage;
