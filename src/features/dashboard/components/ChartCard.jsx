import { useEffect, useRef, useState } from "react";

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}

export default function ChartCard({ title, children, right }) {
  const [containerRef, size] = useElementSize();
  const width = Math.max(0, Math.floor(size.width));
  const height = Math.max(0, Math.floor(size.height));

  return (
    <div
      className="
        group relative
        bg-white
        border border-slate-200/70
        rounded-3xl
        shadow-sm
        transition-all
        hover:shadow-md
        hover:-translate-y-[1px]
      "
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-800">
            {title}
          </h3>
          <div className="mt-0.5 h-[2px] w-10 rounded-full bg-slate-900/80" />
        </div>

        {right && (
          <div
            className="
              text-xs font-medium
              text-slate-500
              bg-slate-100
              px-2.5 py-1
              rounded-full
            "
          >
            {right}
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div
        ref={containerRef}
        className="
          relative
          w-full
          min-w-0
          h-[300px]
          px-4
          pb-5
        "
      >
        {width > 0 && height > 0 ? (
          typeof children === "function" ? children({ width, height }) : children
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-slate-400 animate-pulse">
              Cargando gráfica...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
