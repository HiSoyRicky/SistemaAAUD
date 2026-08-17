// TonersManager.jsx

import { useEffect, useState } from 'react';
import api from '../../../../shared/api/apiClient';
import Pagination from '../../../../shared/components/ui/Pagination';
import { Toners } from '../../../inventory/toners/services/toners.api';
import TonerForm from './TonerForm';
import TonersTable from './TonersTable';

export default function TonersManager() {
  const [toners, setToners] = useState([]);
  const [models, setModels] = useState([]);

  // Crear toner
  const [newPrinterModel, setNewPrinterModel] = useState('');
  const [newTonerName, setNewTonerName] = useState('');
  const [newTonerCode, setNewTonerCode] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newMinStock, setNewMinStock] = useState(0);

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
    if (!newPrinterModel || !newTonerName || !newTonerCode) {
      showError('Complete todos los campos obligatorios');
      return;
    }

    try {
      await Toners.create({
        name: newTonerName,
        toner_model: newTonerCode,
        color: newColor,
        id_printer_model: Number(newPrinterModel),
        min_stock: Number(newMinStock),
      });

      setNewPrinterModel('');
      setNewTonerName('');
      setNewTonerCode('');
      setNewColor('');
      setNewMinStock(0);

      fetchAll();
      showSuccess('Tóner creado correctamente');
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
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  const startEdit = (toner) => {
    setEditingToner(toner.id);
    setEditName(toner.name);
    setEditCode(toner.toner_model || '');
  };

  const updateToner = async () => {
    try {
      await Toners.update(editingToner, {
        name: editName,
        toner_model: editCode,
      });

      setEditingToner(null);
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

      <TonerForm
        models={models}
        newPrinterModel={newPrinterModel}
        setNewPrinterModel={setNewPrinterModel}
        newTonerName={newTonerName}
        setNewTonerName={setNewTonerName}
        newTonerCode={newTonerCode}
        setNewTonerCode={setNewTonerCode}
        newColor={newColor}
        setNewColor={setNewColor}
        newMinStock={newMinStock}
        setNewMinStock={setNewMinStock}
        addToner={addToner}
        addMovement={addMovement}
      />

      <TonersTable
        toners={sortedToners}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        editingToner={editingToner}
        editName={editName}
        editCode={editCode}
        setEditName={setEditName}
        setEditCode={setEditCode}
        startEdit={startEdit}
        updateToner={updateToner}
        deleteToner={deleteToner}
        movementTonerId={movementTonerId}
        setMovementTonerId={setMovementTonerId}
      />

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
