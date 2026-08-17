// ChartCard.jsx

import { useEffect, useRef, useState } from 'react';

function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return undefined;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      requestAnimationFrame(() => {
        setSize((prev) => {
          if (prev.width === width && prev.height === height) {
            return prev;
          }

          return { width, height };
        });
      });
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

  const hasSize = width > 0 && height > 0;

  let chartContent;

  if (!hasSize) {
    chartContent = (
      <div className="flex h-full items-center justify-center">
        <span className="animate-pulse text-sm text-slate-400">Cargando gráfica...</span>
      </div>
    );
  } else if (typeof children === 'function') {
    chartContent = children({ width, height });
  } else {
    chartContent = children;
  }

  return (
    <div className="group relative rounded-3xl border border-slate-200/70 bg-white shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md">
      <div className="flex items-center justify-between px-6 pb-3 pt-5">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-800">{title}</h3>
          <div className="mt-0.5 h-[2px] w-10 rounded-full bg-slate-900/80" />
        </div>

        {right && (
          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {right}
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div ref={containerRef} className="relative h-[300px] w-full min-w-0 px-4 pb-5">
        {chartContent}
      </div>
    </div>
  );
}
