// incidentsSocket.js
import { subscribe, emitEvent } from "./socketClient";

export const onIncidentCreated = (cb) =>
    subscribe("incidentCreated", cb);

export const onIncidentUpdated = (cb) =>
    subscribe("incidentUpdated", cb);

export const onIncidentDeleted = (cb) =>
    subscribe("incidentDeleted", cb);

export const joinIncidentRoom = (incidentId) =>
    emitEvent("joinIncidentRoom", incidentId);

export const leaveIncidentRoom = (incidentId) =>
    emitEvent("leaveIncidentRoom", incidentId);