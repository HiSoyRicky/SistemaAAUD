// NotificationRecipientsManager.jsx

import { Mail, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../../../shared/hooks/useAuth';
import NotificationRecipientsApi from '../../services/notificationRecipients.api';

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || 'Ocurrió un error';
}

export default function NotificationRecipientsManager() {
  const { hasPermission } = useAuth();
  const [recipients, setRecipients] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission('notification_settings.create');
  const canDelete = hasPermission('notification_settings.delete');

  const loadRecipients = async () => {
    try {
      setLoading(true);
      setRecipients(await NotificationRecipientsApi.fetchAll());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipients();
  }, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    try {
      setSaving(true);
      await NotificationRecipientsApi.create({ email: email.trim() });
      setEmail('');
      toast.success('Destinatario agregado');
      await loadRecipients();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (recipient) => {
    try {
      await NotificationRecipientsApi.setActive(recipient.id, !recipient.active);
      await loadRecipients();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemove = async (recipient) => {
    if (!window.confirm(`¿Eliminar a ${recipient.email} de los destinatarios de notificaciones?`)) {
      return;
    }

    try {
      await NotificationRecipientsApi.remove(recipient.id);
      toast.success('Destinatario eliminado');
      await loadRecipients();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Mail className="w-5 h-5" /> Destinatarios de notificaciones de incidencias
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Estos correos reciben una copia interna cada vez que se registra una nueva incidencia.
          Agrega, desactiva o elimina destinatarios sin necesidad de modificar código.
        </p>
      </div>

      {canCreate && (
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@aaud.gob.pa"
            className="h-10 flex-1 min-w-[240px] rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Correo</th>
              <th className="px-4 py-2 text-center">Activo</th>
              <th className="px-4 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && recipients.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No hay destinatarios configurados.
                </td>
              </tr>
            )}
            {recipients.map((recipient) => (
              <tr key={recipient.id}>
                <td className="px-4 py-2 text-slate-700">{recipient.email}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(recipient)}
                    disabled={!canCreate}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      recipient.active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {recipient.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleRemove(recipient)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
