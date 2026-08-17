import {
  BarChart3,
  CheckCircle2,
  Download,
  MonitorUp,
  PlusCircle,
  Search,
  Ticket,
  UserCheck,
  X,
} from 'lucide-react';
import { useMemo } from 'react';
import useAuth from '../../../shared/hooks/useAuth';

import SuccessMessage from '../../../shared/common/SuccessMessage';
import IncidentEditForm from '../components/forms/IncidentEditForm';
import IncidentForm from '../components/forms/IncidentForm';
import AssignTechnicianModal from '../components/modals/AssignTechnicianModal';
import ResolveIncidentModal from '../components/modals/ResolveIncidentModal';
import IncidentTable from '../components/tables/IncidentTable';

import useIncidentsPage from '../hooks/useIncidentsPage';

const roleCopy = {
  admin: {
    title: 'Centro de incidencias',
    subtitle: 'Supervisa, asigna y da seguimiento a los reportes de soporte.',
  },
  consultor: {
    title: 'Gestión de incidencias',
    subtitle: 'Revisa nuevos reportes y coordina la atención técnica.',
  },
  tecnico: {
    title: 'Mis incidencias',
    subtitle: 'Consulta tus asignaciones y registra soluciones pendientes.',
  },
  trabajador: {
    title: 'Reportar incidencia',
    subtitle: 'Envía una solicitud al equipo de soporte con los datos necesarios.',
  },
};

function getStatusMetrics(incidents = []) {
  const total = incidents.length;
  const pending = incidents.filter((item) => Number(item.id_status) === 1).length;
  const assigned = incidents.filter((item) => Number(item.id_status) === 2).length;
  const resolved = incidents.filter((item) => Number(item.id_status) === 3).length;

  return { total, pending, assigned, resolved };
}

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
    handleAddIncident,
    handleOpenAssignModal,
    handleOpenResolveModal,
    confirmAssign,
    submitSolution,
    handleExportIncidents,
  } = useIncidentsPage({ userType, loggedUserName, loggedUserId });

  const pageCopy = roleCopy[userType] || roleCopy.trabajador;
  const metrics = useMemo(
    () => getStatusMetrics(sortedIncidentsForTable),
    [sortedIncidentsForTable]
  );
  const metricCards = useMemo(() => {
    const cards = [
      {
        key: 'total',
        label: 'Total',
        value: metrics.total,
        color: 'text-slate-950',
        labelColor: 'text-slate-500',
        icon: BarChart3,
      },
    ];

    if (userType !== 'tecnico') {
      cards.push({
        key: 'pending',
        label: 'Pendientes',
        value: metrics.pending,
        color: 'text-rose-600',
        labelColor: 'text-rose-600',
        icon: Ticket,
      });
    }

    cards.push(
      {
        key: 'assigned',
        label: 'Asignadas',
        value: metrics.assigned,
        color: 'text-amber-600',
        labelColor: 'text-amber-600',
        icon: UserCheck,
      },
      {
        key: 'resolved',
        label: 'Resueltas',
        value: metrics.resolved,
        color: 'text-emerald-600',
        labelColor: 'text-emerald-600',
        icon: CheckCircle2,
      }
    );

    return cards;
  }, [metrics, userType]);
  const canManageIncidents = userType && userType !== 'trabajador';
  const canUseActions = ['admin', 'tecnico', 'consultor'].includes(userType);

  return (
    <div className="w-full space-y-5">
      {notification.message && (
        <SuccessMessage
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: '', type: '' })}
        />
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Ticket size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-950">{pageCopy.title}</h1>
                <p className="text-sm text-slate-500">{pageCopy.subtitle}</p>
              </div>
            </div>
          </div>

          {canUseActions && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowIncidentForm((prev) => !prev)}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition ${
                  showIncidentForm
                    ? 'bg-slate-700 hover:bg-slate-800'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {showIncidentForm ? <X size={16} /> : <PlusCircle size={16} />}
                {showIncidentForm ? 'Cerrar formulario' : 'Nueva incidencia'}
              </button>

              {canManageIncidents && (
                <>
                  <button
                    type="button"
                    onClick={handleExportIncidents}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Download size={16} />
                    Exportar
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open('/incidencias/monitor', '_blank')}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <MonitorUp size={16} />
                    Monitor
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {canManageIncidents && (
          <div
            className={`grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 ${
              metricCards.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
            }`}
          >
            {metricCards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.key} className="bg-white px-5 py-4 text-center">
                  <div
                    className={`flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide ${card.labelColor}`}
                  >
                    <Icon size={15} />
                    {card.label}
                  </div>
                  <div className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {userType === 'trabajador' ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
        </section>
      ) : (
        showIncidentForm && (
          <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <IncidentForm onSubmit={handleAddIncident} loggedUserName={loggedUserName} />
          </section>
        )
      )}

      {canManageIncidents && (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Listado de incidencias</h2>
            </div>

            <div className="relative w-full lg:max-w-xl">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar por usuario, correo, ubicación, categoría, estado o descripción"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <IncidentTable
            incidents={filteredIncidentsForTable}
            userType={userType}
            onAssign={['admin', 'consultor'].includes(userType) ? handleOpenAssignModal : null}
            onResolve={userType === 'tecnico' ? handleOpenResolveModal : null}
            onEdit={setIncidentToEdit}
          />
        </section>
      )}

      {incidentToEdit && incidentToEdit.id_incident ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-5 shadow-2xl">
            <IncidentEditForm
              incident={incidentToEdit}
              onCancel={() => setIncidentToEdit(null)}
              onSave={() => {
                setIncidentToEdit(null);
              }}
            />
          </div>
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
