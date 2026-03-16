// DocumentsTable.jsx
import React from "react";
import { FileText, Eye, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const DirectionBadge = ({ type }) => {
  const isEntry = type?.toUpperCase() === "ENTRADA";
  return (
    <span className={`flex items-center gap-1 w-fit px-2.5 py-0.5 rounded-full text-xs font-bold border ${
      isEntry ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"
    }`}>
      {isEntry ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
      {isEntry ? "ENTRADA" : "SALIDA"}
    </span>
  );
};

export default function DocumentsTable({ filtered, loading, onDetail }) {
  return (
    <div className="overflow-hidden bg-white border shadow-sm border-slate-200 rounded-2xl">
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100dvh-16rem)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-50/50 border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-500">Identificador</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-500">Dirección</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-500">Documento</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-slate-500">Asunto</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-center uppercase text-slate-500">Archivo</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right uppercase text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-slate-50/80 group">
                <td className="px-4 py-4">
                  <div className="font-bold text-slate-900">{d.consecutive}</div>
                  <div className="text-xs text-slate-400">Año {d.year}</div>
                </td>
                <td className="px-4 py-4">
                  <DirectionBadge type={d.direction} />
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-slate-700">{d.doc_type_name}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[150px]">{d.origin_name}</div>
                </td>
                <td className="max-w-xs px-4 py-4">
                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-2" title={d.subject}>
                    {d.subject}
                  </p>
                </td>
                <td className="px-4 py-4 text-center">
                  {d.attachment ? (
                    <a href={d.attachment} target="_blank" className="inline-flex p-2 text-indigo-600 transition-colors rounded-lg bg-indigo-50 hover:bg-indigo-100">
                      <FileText className="w-5 h-5" />
                    </a>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-4 text-right">
                  <button 
                    onClick={() => onDetail(d)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <Eye className="w-4 h-4" /> Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
