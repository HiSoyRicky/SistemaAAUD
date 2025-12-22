// src/components/incidents/IncidentEditModal.jsx
import React from "react";
import { Modal } from "react-bootstrap";
import IncidentEditForm from "./forms/IncidentEditForm";

function IncidentEditModal({ incident, onClose, onSave }) {
    if (!incident) return null;

    return (
        <Modal show={!!incident} onHide={onClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Editar incidencia #{String(incident.id_incident).padStart(6, "0")}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <IncidentEditForm
                    incident={incident}
                    onCancel={onClose}
                    onSave={onSave}
                />
            </Modal.Body>
        </Modal>
    );
}

export default IncidentEditModal;
