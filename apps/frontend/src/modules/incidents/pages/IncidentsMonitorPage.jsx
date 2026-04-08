import { useEffect, useState } from "react";
import { Incidents } from "../services/incidents.api";
import IncidentTable from "../components/tables/IncidentTable";
import IncidentsSection from "../../dashboard/components/IncidentsSection.jsx";

export default function IncidentsMonitorPage() {

    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        const data = await Incidents.fetchAll();
        setIncidents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6">

            <h1 className="mb-10 text-5xl font-bold text-center">
                Monitor de Incidencias
            </h1>

            <IncidentsSection
                incidences={incidents}
                loading={loading}
            />

            <IncidentTable
                incidents={incidents}
                visibleColumns={{
                    email: false,
                    actions: false
                }}
            />

        </div>
    );
}