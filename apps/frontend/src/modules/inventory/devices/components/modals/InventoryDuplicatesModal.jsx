import { AlertTriangle, ClipboardCheck, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import ModalLayer from '../../../../../shared/components/ui/ModalLayer';

export default function InventoryDuplicatesModal({ open, onClose, onSearchGroup, duplicateTags = [], duplicateSeries = [] }) {
  const [tab, setTab] = useState('tags');
  const [search, setSearch] = useState('');
  const groups = tab === 'tags' ? duplicateTags : duplicateSeries;
  const filteredGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    if (!term) return groups;
    return groups.filter((group) =>
      [group.value, ...group.items.flatMap((item) => [item.tag, item.serie, item.device, item.brand, item.model, item.location, item.department])]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('es').includes(term))
    );
  }, [groups, search]);

  if (!open) return null;

  return (
    <ModalLayer>
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="duplicate-modal-title">
      <section className="max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle size={23} /></span>
            <div>
              <h2 id="duplicate-modal-title" className="text-xl font-bold text-slate-900">Revisión de duplicados</h2>
              <p className="mt-1 text-sm text-slate-600">Compara cada registro con los activos que comparten su marbete o serie y corrige los casos confirmados.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200" aria-label="Cerrar"><X size={20} /></button>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap rounded-lg bg-slate-100 p-1">
            <button type="button" onClick={() => setTab('tags')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'tags' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600'}`}>
              Marbetes ({duplicateTags.length})
            </button>
            <button type="button" onClick={() => setTab('series')} className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === 'series' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600'}`}>
              Series ({duplicateSeries.length})
            </button>
          </div>
          <label className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar marbete, serie, equipo..." className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
          </label>
        </div>

        <div className="bg-slate-50 p-5">
          {filteredGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500"><ClipboardCheck className="mx-auto mb-2 text-emerald-600" />No hay coincidencias en esta sección.</div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <article key={`${tab}-${group.value}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tab === 'tags' ? 'Marbete repetido' : 'Serie repetida'}</span>
                      <h3 className="font-mono text-lg font-bold text-slate-900">{group.value}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${tab === 'tags' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
                      {tab === 'tags' ? 'URGENTE · verificar identidad' : 'REVISIÓN · confirmar si corresponde'}
                    </span>
                    {onSearchGroup && <button type="button" onClick={() => onSearchGroup(group.value)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Ver en inventario</button>}
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="font-semibold text-slate-900">Activo #{item.id} · {item.tag || 'Sin marbete'}</p><p className="mt-0.5 text-sm text-slate-700">{[item.device, item.brand, item.model].filter(Boolean).join(' · ') || item.assetType}</p></div>
                          <span className="rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600">{item.assetType}</span>
                        </div>
                        {item.serie && <p className="mt-2 text-xs text-slate-600">Serie: <span className="font-mono font-semibold">{item.serie}</span></p>}
                        <p className="mt-1 text-xs text-slate-600">Ubicación: {[item.location, item.department].filter(Boolean).join(' · ') || 'Sin ubicación asignada'}</p>
                        <p className={`mt-2 rounded-md px-2.5 py-2 text-xs font-medium ${tab === 'tags' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'}`}>
                          {tab === 'tags'
                            ? 'Corrección sugerida: confirme el marbete físico y asigne un número único al registro incorrecto.'
                            : 'Observación: verifique placa, fabricante y etiqueta física; la serie puede ser compartida legítimamente en algunos equipos.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
          <span>Los marbetes numéricos duplicados requieren corrección; las series necesitan confirmación del registro.</span>
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Cerrar</button>
        </footer>
      </section>
    </div>
    </ModalLayer>
  );
}
