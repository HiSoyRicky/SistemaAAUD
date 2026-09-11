import IncidentForm from '../components/forms/IncidentForm';
import { Incidents } from '../services/incidents.api';

function CreateIncidentPage() {
  const handleCreateIncident = async (payload) => {
    return Incidents.create(payload);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Contenido */}
      <main className="px-4 py-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-5 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Reportar incidencia</h1>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <IncidentForm loggedUserId={2} onSubmit={handleCreateIncident} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateIncidentPage;
