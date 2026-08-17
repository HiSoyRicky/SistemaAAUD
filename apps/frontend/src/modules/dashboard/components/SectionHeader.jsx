// SectionHeader.jsx

export default function SectionHeader({ title, desc, icon: Icon }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="grid text-white shadow-sm w-11 h-11 shrink-0 place-items-center rounded-2xl bg-slate-900">
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>

        {desc && <p className="max-w-2xl mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>}

        <div className="mt-2 h-[2px] w-12 rounded-full bg-slate-900/70" />
      </div>
    </div>
  );
}
