// src/components/admin/UserForm.jsx
import React from "react";

export default function UserForm({ form, setForm, roles, handleSubmit, onCancel }) {
    return (
        <form
            onSubmit={handleSubmit}
            className="mb-8 p-8 bg-white border border-gray-200 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-6"
        >
            {/* Nombre */}
            <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Nombre completo
                </label>
                <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>

            {/* Usuario */}
            <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Usuario
                </label>
                <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>

            {/* Correo */}
            <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Correo electrónico
                </label>
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>

            {/* Rol */}
            <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Rol
                </label>
                <select
                    value={form.id_rol}
                    onChange={(e) => setForm({ ...form, id_rol: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.role_name}</option>
                    ))}
                </select>
            </div>

            {/* Contraseña */}
            <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Contraseña
                </label>
                <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={form.id ? "Dejar vacío para no cambiar" : ""}
                    className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!form.id}
                />
            </div>

            {/* Activo con Toggle Switch */}
            <div className="flex items-center gap-3 mt-6 md:mt-0 col-span-2">
                <span className="font-medium">Activo</span>
                <button
                    type="button"
                    onClick={() => setForm({ ...form, active: form.active === 1 ? 0 : 1 })}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors 
                ${form.active === 1 ? "bg-green-500" : "bg-gray-300"}`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                        ${form.active === 1 ? "translate-x-3" : "translate-x-0"}`}
                    />
                </button>

            </div>

            {/* Botones */}
            <div className="md:col-span-2 flex justify-end mt-6 gap-4">
                <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow hover:from-blue-700 hover:to-blue-800 transition"
                >
                    {form.id ? "Actualizar Usuario" : "Crear Usuario"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
