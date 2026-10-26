// TonersManager.jsx

import { useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Pagination from '../../../../shared/components/ui/Pagination';
import Modal from '../../../../shared/components/ui/Modal';
import { Toners } from '../../../inventory/toners/services/toners.api';
import TonerForm from './TonerForm';
import TonersTable from './TonersTable';
import normalizeCatalogName from '../../../../shared/utils/normalizeCatalogName';

export default function TonersManager() {
  const [toners, setToners] = useState([]);
  const [models, setModels] = useState([]);

  // Crear toner
  const [newPrinterModel, setNewPrinterModel] = useState('');
  const [newTonerCode, setNewTonerCode] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newMinStock, setNewMinStock] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Movimientos
  const [movementTonerId, setMovementTonerId] = useState(null);
  const [movementType, setMovementType] = useState('IN');
  const [movementQuantity, setMovementQuantity] = useState(1);
  const [movementReference, setMovementReference] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const sortedToners = [...toners].sort((a, b) => a.id - b.id);
  const totalPages = Math.ceil(sortedToners.length / itemsPerPage);
  const similarToners = newTonerCode.trim()
    ? toners.filter((toner) =>
        (!newPrinterModel || Number(toner.id_printer_model) === Number(newPrinterModel)) &&
        (!newColor || toner.color === newColor) &&
        normalizeCatalogName(toner.toner_model).includes(normalizeCatalogName(newTonerCode))
      )
    : [];

  // CARGAR DATOS

  const fetchAll = async () => {
    try {
      const data = await Toners.fetchAll();
      setToners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar toners:', err);
      setErrorMessage('Error al cargar toners');
    }
  };

  const fetchPrinterModels = async () => {
    try {
      const response = await api.get('/api/models/printers');
      setModels(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error cargando modelos:', err);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchPrinterModels();
  }, []);

  // MENSAJES

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // CREAR TONER

  const addToner = async () => {
    if (!newPrinterModel || !newTonerCode) {
      showError('Complete todos los campos obligatorios');
      return;
    }

    try {
      await Toners.create({
        toner_model: newTonerCode,
        color: newColor,
        id_printer_model: Number(newPrinterModel),
        min_stock: Number(newMinStock),
      });

      setNewPrinterModel('');
      setNewTonerCode('');
      setNewColor('');
      setNewMinStock(0);

      fetchAll();
      showSuccess('Tóner creado correctamente');
      setShowCreateModal(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Error al crear tóner');
    }
  };

  // ELIMINAR
  const deleteToner = async (id) => {
    if (!window.confirm('¿Eliminar este tóner?')) return;

    try {
      await Toners.delete(id);
      fetchAll();
      showSuccess('Tóner eliminado');
    } catch (err) {
      showError(err.response?.data?.message || 'Error al eliminar tóner');
    }
  };

  // MOVIMIENTOS
  const addMovement = async (id_toner) => {
    if (movementQuantity <= 0) {
      showError('Cantidad inválida');
      return;
    }

    try {
      await Toners.addMovement({
        id_toner,
        movement_type: movementType,
        quantity: Number(movementQuantity),
        reference: movementReference,
      });

      setMovementTonerId(null);
      setMovementQuantity(1);
      setMovementReference('');
      setMovementType('IN');

      fetchAll();
      showSuccess('Movimiento registrado');
    } catch (err) {
      showError(err.response?.data?.message || 'Error en movimiento');
    }
  };

  // EDICIÓN

  const [editingToner, setEditingToner] = useState(null);
  const [editCode, setEditCode] = useState('');

  const startEdit = (toner) => {
    setEditingToner(toner.id);
    setEditCode(toner.toner_model || '');
    setErrorMessage('');
    setShowEditModal(true);
  };

  const updateToner = async () => {
    if (!editCode.trim() || !editingToner) {
      showError('El modelo o código del tóner es obligatorio');
      return;
    }
    try {
      await Toners.update(editingToner, {
        toner_model: editCode,
      });

      setEditingToner(null);
      setShowEditModal(false);
      fetchAll();
      showSuccess('Tóner actualizado');
    } catch (err) {
      showError(err.response?.data?.message || 'Error al actualizar tóner');
    }
  };

  // RENDER
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Gestión de Tóners</h2>

      {(successMessage || errorMessage) && (
        <div className={`p-2 rounded ${successMessage ? 'bg-green-200' : 'bg-red-200'}`}>
          {successMessage || errorMessage}
        </div>
      )}

      <button type="button" onClick={() => setShowCreateModal(true)} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white">Crear tóner</button>
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear tóner" size="lg">
      <TonerForm
        models={models}
        newPrinterModel={newPrinterModel}
        setNewPrinterModel={setNewPrinterModel}
        newTonerCode={newTonerCode}
        setNewTonerCode={setNewTonerCode}
        newColor={newColor}
        setNewColor={setNewColor}
        newMinStock={newMinStock}
        setNewMinStock={setNewMinStock}
        addToner={addToner}
        addMovement={addMovement}
      />
      {similarToners.length > 0 && (
        <ul className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm" aria-label="Tóneres similares">
          <li className="mb-1 font-semibold">Modelos similares existentes</li>
          {similarToners.slice(0, 8).map((toner) => <li key={toner.id}>{toner.toner_model} · {toner.printer_model || 'Impresora'} · {toner.color}</li>)}
        </ul>
      )}
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar tóner" size="lg">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Modelo / código
            <input value={editCode} onChange={(event) => setEditCode(event.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowEditModal(false)} className="rounded border px-4 py-2">Cancelar</button>
            <button type="button" onClick={updateToner} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white">Guardar</button>
          </div>
        </div>
      </Modal>

      <TonersTable
        toners={sortedToners}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        startEdit={startEdit}
        deleteToner={deleteToner}
        movementTonerId={movementTonerId}
        setMovementTonerId={setMovementTonerId}
      />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
