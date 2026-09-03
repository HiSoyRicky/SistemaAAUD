import { Edit3, Plus, Save, Shield, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../../../shared/hooks/useAuth';
import RolesApi from '../../services/roles.api';

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || 'Ocurrió un error';
}

export default function RolesManager() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission('roles.create');
  const canUpdate = hasPermission('roles.update');
  const canDelete = hasPermission('roles.delete');

  const loadRoles = async () => {
    try {
      setLoading(true);
      setRoles(await RolesApi.fetchAll());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setFormError('');
    setModalOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setFormError('El nombre del rol es requerido.');
      return;
    }

    const duplicate = roles.some(
      (role) =>
        Number(role.id) !== Number(editingId) &&
        role.name.trim().toLocaleLowerCase() === normalizedName.toLocaleLowerCase()
    );
    if (duplicate) {
      setFormError('Ya existe un rol con ese nombre.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      if (editingId) {
        await RolesApi.update(editingId, { name: normalizedName });
        toast.success('Rol actualizado');
      } else {
        await RolesApi.create({ name: normalizedName });
        toast.success('Rol creado');
      }
      resetForm();
      await loadRoles();
    } catch (error) {
      const message = error.response?.status === 409 ? 'Ya existe un rol con ese nombre.' : getErrorMessage(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (role) => {
    setEditingId(role.id);
    setName(role.name);
    setFormError('');
    setModalOpen(true);
  };

  const remove = async (role) => {
    if (!window.confirm(`¿Eliminar el rol "${role.name}"?`)) return;

    try {
      await RolesApi.remove(role.id);
      toast.success('Rol eliminado');
      await loadRoles();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white"><Shield size={22} /></div>
          <div><h2 className="text-2xl font-bold text-slate-900">Roles</h2><p className="text-sm text-slate-500">Crea roles y revisa sus usuarios y permisos asignados.</p></div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin/permissions" className="text-sm font-semibold text-blue-600 hover:text-blue-800">Gestionar permisos</Link>
          {canCreate && <button type="button" onClick={() => { resetForm(); setModalOpen(true); }} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} />+ Crear rol</button>}
        </div>
      </div>

      {modalOpen && (canCreate || (editingId && canUpdate)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
          <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between"><h3 id="role-modal-title" className="text-xl font-bold text-slate-900">{editingId ? 'Editar rol' : 'Crear nuevo rol'}</h3><button type="button" title="Cerrar" onClick={resetForm} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
            <label className="text-sm font-semibold text-slate-700">Nombre del rol<input autoFocus value={name} maxLength={50} onChange={(event) => { setName(event.target.value); setFormError(''); }} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Ej. Encargado de Almacén" required /></label>
            {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={resetForm} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><X size={16} />Cancelar</button><button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Save size={16} />{editingId ? 'Guardar cambios' : 'Crear'}</button></div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Usuarios</th><th className="px-4 py-3">Permisos</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">Cargando roles...</td></tr> : roles.map((role) => <tr key={role.id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold text-slate-900">{role.name}</td><td className="px-4 py-3">{role.users_count}</td><td className="px-4 py-3">{role.permissions_count}</td><td className="px-4 py-3"><div className="flex justify-end gap-2">{canUpdate && <button type="button" title="Editar rol" onClick={() => startEdit(role)} className="rounded-md p-2 text-blue-600 hover:bg-blue-50"><Edit3 size={17} /></button>}{canDelete && <button type="button" title="Eliminar rol" onClick={() => remove(role)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 size={17} /></button>}<Link title="Gestionar permisos" to={`/admin/permissions?role=${role.id}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Plus size={17} /></Link></div></td></tr>)}{!loading && !roles.length && <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No hay roles registrados.</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}