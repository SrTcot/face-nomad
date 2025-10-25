import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserX, CheckSquare, Square, Users, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Notification from '../components/Notification';
import { api, getWorkerPhotoUrl } from '../services/api';

export default function ManageWorkersScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const result = await api.getWorkers();
      if (result.success) {
        setWorkers(result.workers || []);
      } else {
        setNotification({
          message: 'Error al cargar trabajadores',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error al cargar trabajadores:', error);
      setNotification({
        message: 'Error de conexión con el servidor',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (workerName) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(workerName)) {
      newSelected.delete(workerName);
    } else {
      newSelected.add(workerName);
    }
    setSelectedWorkers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedWorkers.size === workers.length && workers.length > 0) {
      setSelectedWorkers(new Set());
    } else {
      const allNames = new Set(workers.map(w => w.name));
      setSelectedWorkers(allNames);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedWorkers.size === 0) {
      setNotification({
        message: 'No hay trabajadores seleccionados',
        type: 'warning'
      });
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar ${selectedWorkers.size} trabajador(es)? Esta acción eliminará sus fotos del sistema y no se puede deshacer.`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      let deletedCount = 0;
      let errors = [];

      for (const workerName of selectedWorkers) {
        const result = await api.deleteWorker(workerName);
        if (result.success) {
          deletedCount++;
        } else {
          errors.push(`${workerName}: ${result.message}`);
        }
      }

      if (deletedCount > 0) {
        setNotification({
          message: `${deletedCount} trabajador(es) eliminado(s) exitosamente`,
          type: 'success'
        });
        await loadWorkers();
        setSelectedWorkers(new Set());
      }

      if (errors.length > 0) {
        console.error('Errores al eliminar:', errors);
        setNotification({
          message: `Algunos trabajadores no pudieron ser eliminados`,
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error al eliminar trabajadores:', error);
      setNotification({
        message: 'Error al eliminar trabajadores',
        type: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const allSelected = workers.length > 0 && selectedWorkers.size === workers.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-campo-green-50 to-white pb-32">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="sticky top-0 bg-white shadow-md z-10">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="touch-area"
            >
              <ArrowLeft className="w-8 h-8 text-campo-green-600" />
            </button>
            <h1 className="text-3xl font-bold text-campo-green-700 flex-1">
              Gestionar Trabajadores
            </h1>
            {workers.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="touch-area p-2 rounded-lg bg-campo-green-50 hover:bg-campo-green-100 transition-colors"
                title={allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
              >
                {allSelected ? (
                  <CheckSquare className="w-6 h-6 text-campo-green-600" />
                ) : (
                  <Square className="w-6 h-6 text-campo-green-600" />
                )}
              </button>
            )}
          </div>

          {selectedWorkers.size > 0 && (
            <div className="mb-4 p-4 bg-campo-green-100 rounded-lg flex items-center justify-between">
              <span className="text-campo-green-800 font-semibold">
                {selectedWorkers.size} trabajador(es) seleccionado(s)
              </span>
              <button
                onClick={() => setSelectedWorkers(new Set())}
                className="text-sm text-campo-green-700 hover:text-campo-green-900 underline"
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-16 h-16 text-campo-green-500 mx-auto mb-4 animate-spin" />
            <p className="text-xl text-gray-500">Cargando trabajadores...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">No hay trabajadores registrados</p>
            <p className="text-gray-400">Registra trabajadores para comenzar</p>
            <Button
              variant="primary"
              size="large"
              onClick={() => navigate('/register')}
              className="mt-6"
            >
              Registrar Primer Trabajador
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workers.map((worker) => {
              const isSelected = selectedWorkers.has(worker.name);
              return (
                <div 
                  key={worker.id}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                    isSelected ? 'ring-4 ring-campo-green-400' : ''
                  }`}
                >
                  <div className="h-2 bg-campo-green-500"></div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleSelection(worker.name)}
                        className="touch-area"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-8 h-8 text-campo-green-600" />
                        ) : (
                          <Square className="w-8 h-8 text-gray-400" />
                        )}
                      </button>

                      <div className="w-20 h-20 rounded-full overflow-hidden bg-campo-green-100 flex items-center justify-center border-2 border-campo-green-300">
                        <img 
                          src={getWorkerPhotoUrl(worker.name)}
                          alt={worker.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <Users className="w-8 h-8 text-campo-green-600" style={{ display: 'none' }} />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          {worker.name}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {worker.id}</p>
                        {worker.registered_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            📅 Registrado: {new Date(worker.registered_at).toLocaleString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        {worker.registered_by && (
                          <p className="text-xs text-gray-400">
                            👤 Por: {worker.registered_by}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-6 right-6 space-y-3">
        {selectedWorkers.size > 0 && (
          <Button
            variant="primary"
            size="large"
            icon={UserX}
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Eliminando...' : `Eliminar ${selectedWorkers.size} trabajador(es)`}
          </Button>
        )}
        
        <Button
          variant="outline"
          size="medium"
          icon={ArrowLeft}
          onClick={() => navigate('/')}
          className="w-full bg-white"
        >
          {t('settings.back')}
        </Button>
      </div>
    </div>
  );
}
