export default function FancyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="p-3 bg-white border shadow-md rounded-xl border-slate-200">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">
        Cantidad: <span className="font-bold">{payload[0].value}</span>
      </p>
    </div>
  );
}
