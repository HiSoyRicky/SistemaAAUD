import { useId } from 'react';
import { AtSign, Building2, KeyRound, Mail, MapPin, ShieldCheck, UserRound, UserRoundCheck } from 'lucide-react';
import UbiDepSelector from '../../../../shared/common/UbiDepSelector';

const inputClass = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, icon: Icon, children, hint, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
        {children}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function UserForm({ form, setForm, roles, handleSubmit, onDelete, onCancel, canSave }) {
  const id = useId();
  const editing = Boolean(form.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <UserRound size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{editing ? form.nombre_completo || form.username : 'Nuevo usuario'}</p>
          <p className="mt-0.5 text-sm text-slate-600">{editing ? `Cuenta: ${form.username}` : 'Completa la información para registrar una cuenta.'}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${form.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${form.active ? 'bg-emerald-600' : 'bg-slate-500'}`} />
          {form.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <Section icon={UserRound} title="Información de la cuenta" description="Datos que identifican al usuario dentro del sistema.">
        <Field label="Nombre completo" htmlFor={`${id}-nombre`} icon={UserRound}>
          <input id={`${id}-nombre`} type="text" autoComplete="name" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} className={`${inputClass} pl-10`} placeholder="Nombre y apellido" required />
        </Field>
        <Field label="Nombre de usuario" htmlFor={`${id}-username`} icon={AtSign}>
          <input id={`${id}-username`} type="text" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={`${inputClass} pl-10`} placeholder="usuario" required />
        </Field>
        <Field label="Correo electrónico" htmlFor={`${id}-email`} icon={Mail} hint="Opcional. Se utiliza para notificaciones de la cuenta.">
          <input id={`${id}-email`} type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`${inputClass} pl-10`} placeholder="usuario@aaud.gob.pa" />
        </Field>
        {!editing && (
          <Field label="Contraseña inicial" htmlFor={`${id}-password`} icon={KeyRound} hint="El usuario podrá cambiarla después de ingresar.">
            <input id={`${id}-password`} type="password" autoComplete="new-password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputClass} pl-10`} placeholder="Contraseña segura" required />
          </Field>
        )}
      </Section>

      <Section icon={Building2} title="Asignación institucional" description="Define el rol y la ubicación organizativa del usuario.">
        <Field label="Rol del sistema" htmlFor={`${id}-role`} icon={ShieldCheck}>
          <select id={`${id}-role`} value={form.id_rol} onChange={(e) => setForm({ ...form, id_rol: Number.parseInt(e.target.value, 10) })} className={`${inputClass} pl-10`} required>
            <option value="" disabled>Selecciona un rol</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${form.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}><UserRoundCheck size={18} aria-hidden="true" /></span>
            <div><p className="text-sm font-semibold text-slate-800">Acceso a la cuenta</p><p className="text-xs text-slate-500">{form.active ? 'El usuario puede ingresar al sistema.' : 'El acceso del usuario está desactivado.'}</p></div>
          </div>
          <button type="button" role="switch" aria-checked={Boolean(form.active)} aria-label="Activar cuenta" onClick={() => setForm({ ...form, active: !form.active })} className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-blue-100 ${form.active ? 'bg-emerald-600' : 'bg-slate-300'}`}>
            <span className={`mt-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><MapPin size={16} className="text-slate-500" aria-hidden="true" />Ubicación y departamento</div>
          <UbiDepSelector mode="inventory" compact id_ubication={form.id_ubication} id_department={form.id_department} errors={{}} onChange={({ id_ubication, id_department }) => setForm((prev) => ({ ...prev, id_ubication, id_department }))} />
        </div>
      </Section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>{editing && onDelete && <button type="button" onClick={onDelete} className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto">Eliminar usuario</button>}</div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar</button>
          {canSave && <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">{editing ? 'Guardar cambios' : 'Crear usuario'}</button>}
        </div>
      </div>
    </form>
  );
}
