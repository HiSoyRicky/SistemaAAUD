import { Pencil, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import ModalLayer from '../../../../shared/components/ui/ModalLayer';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';

const emptyForm = { id_brand: '', id_model: '', model_year: '', vehicle_type: '', fuel_type: '' };
const currentYear = new Date().getFullYear();
const modelYears = Array.from(
  { length: currentYear + 5 - 1950 + 1 },
  (_, index) => currentYear + 5 - index
);
const vehicleTypes = [
  'Barredora',
  'Bus',
  'Busito / microbús',
  'Camión',
  'Camión compactador',
  'Camión empacador',
  'Camión volquete / volquete',
  'Camioneta',
  'Camión cisterna',
  'Cargador frontal',
  'Cabezal tipo mula',
  'Cama baja',
  'Grúa',
  'Excavadora',
  'Retroexcavadora',
  'Montacarga',
  'Tractor',
  'Mini truck',
  'Minicar',
  'Sedán',
  'Pick-up',
  'Panel',
  'Remolque',
  'Remolque / casa rodante',
  'Roll-off',
];
const fuelTypes = [
  '91',
  '95',
  'Diésel',
  'Eléctrico',
  'Híbrido',
  'Semi-eléctrico',
  'Gas licuado (GLP)',
  'Gas natural',
  'Otro',
];

export default function VehicleCatalogManager() {
  const [catalog, setCatalog] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const availableModels = useMemo(
    () => models.filter((model) => String(model.id_brand) === String(form.id_brand) && model.id_device == null),
    [models, form.id_brand]
  );
  const selectedVehicleModel = models.find((model) => String(model.id) === String(form.id_model));
  const selectedVehicleBrand = brands.find((brand) => String(brand.id) === String(selectedVehicleModel?.id_brand));
  const vehicleBrands = [
    ...brands.filter((brand, index, all) =>
      all.findIndex((candidate) => normalizeCatalogName(candidate.name) === normalizeCatalogName(brand.name)) === index &&
      String(brand.id) !== String(selectedVehicleBrand?.id)
    ),
    ...(selectedVehicleBrand ? [selectedVehicleBrand] : []),
  ];
  const similarConfigurations = catalog.filter((entry) =>
    String(entry.id_brand) === String(form.id_brand) &&
    (!form.id_model || String(entry.id_model) === String(form.id_model)) &&
    (!form.model_year || String(entry.model_year) === String(form.model_year)) &&
    (!form.vehicle_type || normalizeCatalogName(entry.vehicle_type).includes(normalizeCatalogName(form.vehicle_type))) &&
    (!form.fuel_type || normalizeCatalogName(entry.fuel_type).includes(normalizeCatalogName(form.fuel_type))) &&
    Number(entry.id) !== Number(editingId)
  );

  const load = async () => {
    setLoading(true);
    try {
      const [catalogResponse, brandsResponse, modelsResponse] = await Promise.all([
        api.get('/api/inventory/vehicle-catalog'),
        api.get('/api/brands'),
        api.get('/api/models'),
      ]);
      setCatalog(catalogResponse.data);
      setBrands(brandsResponse.data);
      setModels(modelsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el catálogo de vehículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError('');
    const payload = { ...form, model_year: Number(form.model_year) };
    try {
      if (editingId) await api.put(`/api/inventory/vehicle-catalog/${editingId}`, payload);
      else await api.post('/api/inventory/vehicle-catalog', payload);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la configuración del vehículo.');
    }
  };

  const edit = (entry) => {
    setEditingId(entry.id);
    setForm({
      id_brand: String(entry.id_brand),
      id_model: String(entry.id_model),
      model_year: String(entry.model_year),
      vehicle_type: vehicleTypes.includes(entry.vehicle_type) ? entry.vehicle_type : '',
      fuel_type: entry.fuel_type,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  return (
    <section className="space-y-5 p-4">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Catálogo de vehículos</h2>
            <p className="mt-1 text-sm text-slate-600">
              Relaciona una marca y un modelo existentes con año, tipo y combustible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setError('');
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white"
          >
            Agregar vehículo
          </button>
        </div>
      </header>
      {error && !showForm && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {showForm && <ModalLayer><div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="vehicle-catalog-modal-title">
      <form
        onSubmit={save}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h3 id="vehicle-catalog-modal-title" className="text-lg font-semibold text-slate-900">
            {editingId ? 'Editar vehículo del catálogo' : 'Agregar vehículo al catálogo'}
          </h3>
          <button type="button" onClick={closeForm} aria-label="Cerrar" className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium">
          Marca
          <select
            required
            value={form.id_brand}
            onChange={(e) => setForm({ ...form, id_brand: e.target.value, id_model: '' })}
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="">Seleccione marca</option>
            {vehicleBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Modelo
          <select
            required
            value={form.id_model}
            onChange={(e) => setForm({ ...form, id_model: e.target.value })}
            className="mt-1 w-full rounded-lg border p-2"
            disabled={!form.id_brand}
          >
            <option value="">Seleccione modelo</option>
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Año de modelo
          <input
            required
            type="text"
            inputMode="numeric"
            list="vehicle-model-years"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="Escriba o seleccione el año"
            value={form.model_year}
            onChange={(e) => setForm({ ...form, model_year: e.target.value })}
            className="mt-1 w-full rounded-lg border p-2"
          />
          <datalist id="vehicle-model-years">
            {form.model_year && !modelYears.includes(Number(form.model_year)) && (
              <option value={form.model_year} />
            )}
            {modelYears.map((year) => (
              <option key={year} value={year} />
            ))}
          </datalist>
        </label>
        <label className="text-sm font-medium">
          Tipo de vehículo
          <select
            required
            value={form.vehicle_type}
            onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="">Seleccione tipo</option>
            {vehicleTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Combustible
          <select
            required
            value={form.fuel_type}
            onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="">Seleccione combustible</option>
            {form.fuel_type && !fuelTypes.includes(form.fuel_type) && (
              <option value={form.fuel_type}>{form.fuel_type}</option>
            )}
            {fuelTypes.map((fuel) => (
              <option key={fuel} value={fuel}>
                {fuel}
              </option>
            ))}
          </select>
        </label>
        {similarConfigurations.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 md:col-span-2 xl:col-span-3">
            <p className="font-semibold">Configuraciones de vehículo similares ya registradas</p>
            <ul className="mt-1 list-inside list-disc">
              {similarConfigurations.slice(0, 8).map((entry) => (
                <li key={entry.id}>{entry.brand.name} {entry.model.name} {entry.model_year} · {entry.vehicle_type} · {entry.fuel_type}</li>
              ))}
            </ul>
          </div>
        )}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={closeForm} className="rounded-lg border px-4 py-2">Cancelar</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">
            <Save size={16} />
            {editingId ? 'Guardar cambios' : 'Agregar configuración'}
          </button>
        </div>
      </form>
      </div></ModalLayer>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Marca', 'Modelo', 'Año', 'Tipo', 'Combustible', 'Acciones'].map((title) => (
                <th key={title} className="p-3 font-semibold">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4" colSpan="6">
                  Cargando...
                </td>
              </tr>
            ) : (
              catalog.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="p-3">{entry.brand.name}</td>
                  <td className="p-3">{entry.model.name}</td>
                  <td className="p-3">{entry.model_year}</td>
                  <td className="p-3">{entry.vehicle_type}</td>
                  <td className="p-3">{entry.fuel_type}</td>
                  <td className="p-3">
                    <button
                      aria-label="Editar"
                      onClick={() => edit(entry)}
                      className="rounded p-1 text-blue-700"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
