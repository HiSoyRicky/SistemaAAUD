// tabs.jsx

export function Tabs({ value, onValueChange, children }) {
  return <div>{children}</div>;
}

export function TabsList({ children }) {
  return <div className="flex gap-2 mb-4">{children}</div>;
}

export function TabsTrigger({ value, currentValue, onClick, children }) {
  const isActive = value === currentValue;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, currentValue, children }) {
  return value === currentValue ? <div>{children}</div> : null;
}
