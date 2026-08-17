// StatCard.jsx

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'from-slate-600 to-slate-800',
}) {
  return (
    <div className="bg-white border shadow-sm border-slate-200/70 rounded-xl">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={`
    grid
    w-12 h-12
    place-items-center
    rounded-xl
    bg-gradient-to-br ${gradient}
    text-white
    shrink-0
  `}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 truncate">
            {title}
          </p>

          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-900">{value}</span>

            {subtitle && <span className="text-[11px] text-slate-500 truncate">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
