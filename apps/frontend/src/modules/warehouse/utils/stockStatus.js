export function stockStatus(quantity, minimum) {
  const amount = Number(quantity);
  if (amount <= 0) return { label: 'Agotado', className: 'bg-red-50 text-red-700' };
  if (amount <= Number(minimum ?? 0)) return { label: 'Stock bajo', className: 'bg-amber-50 text-amber-800' };
  return { label: 'Disponible', className: 'bg-emerald-50 text-emerald-700' };
}
