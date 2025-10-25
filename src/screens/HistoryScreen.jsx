import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, Clock, Calendar, User, Upload, Trash2, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Notification from '../components/Notification';
import { getAllRegistros, deleteRegistro } from '../db/indexedDB';
import { authService } from '../services/auth';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [registros, setRegistros] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadRegistros();
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    const user = await authService.getUser();
    setUserRole(user?.role);
  };

  const loadRegistros = async () => {
    const data = await getAllRegistros();
    setRegistros(data);
    setSelectedIds(new Set());
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRegistros.length && filteredRegistros.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredRegistros.map(r => r.id));
      setSelectedIds(allIds);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      setNotification({
        message: 'No hay registros seleccionados',
        type: 'warning'
      });
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar ${selectedIds.size} registro(s)? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    try {
      let deletedCount = 0;
      for (const id of selectedIds) {
        await deleteRegistro(id);
        deletedCount++;
      }
      
      setNotification({
        message: `${deletedCount} registro(s) eliminado(s) exitosamente`,
        type: 'success'
      });
      
      await loadRegistros();
    } catch (error) {
      console.error('Error al eliminar registros:', error);
      setNotification({
        message: 'Error al eliminar registros',
        type: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredRegistros = registros.filter(reg => {
    const matchesSearch = reg.workerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || reg.type === filter;
    return matchesSearch && matchesFilter;
  });

  const allSelected = filteredRegistros.length > 0 && selectedIds.size === filteredRegistros.length;
  // TODOS los usuarios (admin, supervisor, operario) pueden eliminar registros
  const canDelete = userRole?.name === 'admin' || userRole?.name === 'supervisor' || userRole?.name === 'operator';
  const canSelect = userRole?.name === 'admin' || userRole?.name === 'supervisor' || userRole?.name === 'operator';

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
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => navigate('/')}
              className="touch-area"
            >
              <ArrowLeft className="w-8 h-8 text-campo-green-600" />
            </button>
            <h1 className="text-3xl font-bold text-campo-green-700 flex-1">
              {t('history.title')}
            </h1>
            {canSelect && filteredRegistros.length > 0 && (
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

          {canSelect && selectedIds.size > 0 && (
            <div className="mb-4 p-4 bg-campo-green-100 rounded-lg flex items-center justify-between">
              <span className="text-campo-green-800 font-semibold">
                {selectedIds.size} registro(s) seleccionado(s)
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-campo-green-700 hover:text-campo-green-900 underline"
              >
                Limpiar selección
              </button>
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder={t('history.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-campo-green-500 text-lg"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'entry', 'exit'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-campo-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t(`history.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredRegistros.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">{t('history.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistros.map((registro) => {
              const isSelected = selectedIds.has(registro.id);
              return (
                <div 
                  key={registro.id}
                  className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                    isSelected ? 'ring-4 ring-campo-green-400' : ''
                  }`}
                >
                  <div className={`h-2 ${
                    registro.type === 'entry' ? 'bg-campo-green-500' : 'bg-campo-brown-500'
                  }`}></div>
                  
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {canSelect && (
                        <button
                          onClick={() => toggleSelection(registro.id)}
                          className="touch-area pt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-8 h-8 text-campo-green-600" />
                          ) : (
                            <Square className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      )}

                      <img 
                        src={registro.workerPhoto} 
                        alt={registro.workerName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-800">
                            {registro.workerName}
                          </h3>
                          {registro.synced ? (
                            <div className="flex items-center gap-1 text-campo-green-600">
                              <CheckCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">{t('history.synced')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Upload className="w-5 h-5" />
                              <span className="text-sm font-medium">{t('history.pending')}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">{registro.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{registro.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className={`text-sm font-semibold ${
                              registro.type === 'entry' ? 'text-campo-green-600' : 'text-campo-brown-600'
                            }`}>
                              {registro.type === 'entry' ? t('validation.entry') : t('validation.exit')}
                            </span>
                          </div>
                        </div>
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
        {canDelete && selectedIds.size > 0 && (
          <Button
            variant="primary"
            size="large"
            icon={Trash2}
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Eliminando...' : `Eliminar ${selectedIds.size} registro(s)`}
          </Button>
        )}
        
        
        <Button
          variant="outline"
          size="large"
          icon={ArrowLeft}
          onClick={() => navigate('/')}
          className="w-full bg-white"
        >
          {t('history.back')}
        </Button>
      </div>
    </div>
  );
}
