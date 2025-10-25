import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Upload, Info, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth';
import Button from '../components/Button';
import Notification from '../components/Notification';
import { getPendingRegistros, markAsSynced } from '../db/indexedDB';
import { cleanDuplicateRegistros } from '../utils/cleanDuplicates';
import { api } from '../services/api';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState(null);
  const [syncApprovalStatus, setSyncApprovalStatus] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [mongoStatus, setMongoStatus] = useState(null);
  const [syncingToMongo, setSyncingToMongo] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [mongoTab, setMongoTab] = useState('workers'); // 'workers' o 'attendance'
  const [mongoWorkers, setMongoWorkers] = useState([]);
  const [mongoAttendance, setMongoAttendance] = useState([]);
  const [selectedMongoWorkers, setSelectedMongoWorkers] = useState(new Set());
  const [selectedMongoAttendance, setSelectedMongoAttendance] = useState(new Set());
  const [loadingMongo, setLoadingMongo] = useState(false);
  const [deletingMongo, setDeletingMongo] = useState(false);

  useEffect(() => {
    const initializeScreen = async () => {
      await loadUser();
    };
    initializeScreen();
  }, []);

  useEffect(() => {
    if (user) {
      checkSyncApprovalStatus();
      checkMongoStatus();
      if (user?.role?.name === 'supervisor' || user?.role?.name === 'admin') {
        loadPendingRequests();
      }
    }
  }, [user]);

  const checkMongoStatus = async () => {
    try {
      const data = await api.getMongoStatus();
      setMongoStatus(data);
    } catch (error) {
      console.error('Error checking MongoDB status:', error);
    }
  };

  const loadUser = async () => {
    const userData = await authService.getUser();
    setUser(userData);
  };

  const checkSyncApprovalStatus = async () => {
    const token = await authService.getAccessToken();
    if (!token) {
      return;
    }
    
    try {
      const data = await api.getSyncApprovalStatus();
      if (data.success) {
        setSyncApprovalStatus(data);
      }
    } catch (error) {
      console.error('Error checking sync approval:', error);
    }
  };

  const loadPendingRequests = async () => {
    const token = await authService.getAccessToken();
    if (!token) {
      return;
    }
    
    setLoadingRequests(true);
    try {
      const data = await api.getPendingSyncRequests();
      if (data.success) {
        setPendingRequests(data.requests);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const requestSyncApproval = async () => {
    const token = await authService.getAccessToken();
    if (!token) {
      showNotif('Debes iniciar sesión primero', 'error');
      return;
    }
    
    try {
      // Obtener registros pendientes para enviarlos con la solicitud
      console.log('Obteniendo registros pendientes...');
      const pending = await getPendingRegistros();
      console.log('Registros pendientes obtenidos:', pending);
      
      // Transformar registros para eliminar problemas de compatibilidad
      const sanitizedRecords = pending.map(r => ({
        id: r.id,
        workerId: r.workerId,
        workerName: r.workerName,
        type: r.type,
        date: r.date,
        time: r.time,
        confidence: r.confidence
      }));
      
      console.log('Enviando solicitud con', sanitizedRecords.length, 'registros');
      const data = await api.requestSyncApproval(sanitizedRecords);
      if (data.success) {
        showNotif(`Solicitud enviada: ${pending.length} registros para revisión del supervisor`, 'success');
        checkSyncApprovalStatus();
      } else {
        showNotif(data.message, 'warning');
      }
    } catch (error) {
      console.error('Error requestSyncApproval completo:', error);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      showNotif('Error al solicitar aprobación: ' + (error.message || 'Error desconocido'), 'error');
    }
  };

  const handleApproval = async (approvalId, action) => {
    const token = await authService.getAccessToken();
    if (!token) {
      showNotif('Debes iniciar sesión primero', 'error');
      return;
    }
    
    try {
      const data = await api.approveSyncRequest(approvalId, action);
      if (data.success) {
        showNotif(data.message, 'success');
        loadPendingRequests();
      } else {
        showNotif(data.message, 'error');
      }
    } catch (error) {
      console.error('Error handleApproval:', error);
      showNotif('Error al procesar solicitud: ' + error.message, 'error');
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    showNotif(t('common.savedLocally'), 'success');
  };

  const showNotif = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

  const handleSync = async () => {
    // Supervisores y Admins NO necesitan aprobación, pueden sincronizar directamente
    const isSupervisorOrAdmin = user?.role?.name === 'supervisor' || user?.role?.name === 'admin';
    
    if (!isSupervisorOrAdmin && !syncApprovalStatus?.can_sync) {
      showNotif('Necesitas aprobación del supervisor para sincronizar', 'warning');
      return;
    }

    setSyncing(true);
    
    try {
      const pending = await getPendingRegistros();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      for (const registro of pending) {
        await markAsSynced(registro.id);
      }
      
      showNotif(t('common.syncComplete'), 'success');
      checkSyncApprovalStatus();
    } catch (error) {
      showNotif(t('common.syncError'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const syncWorkersToMongo = async () => {
    setSyncingToMongo(true);
    try {
      const workersResponse = await api.getWorkers();
      if (!workersResponse.success) {
        showNotif('Error al obtener trabajadores', 'error');
        return;
      }

      const workers = workersResponse.workers.map(w => ({
        name: w,
        registered_at: new Date().toISOString(),
        photo_path: `dataset/${w}.jpg`
      }));

      const result = await api.syncWorkersToMongo(workers);
      if (result.success) {
        showNotif(`${result.message} - Trabajadores sincronizados a MongoDB`, 'success');
      } else {
        showNotif(result.message, 'error');
      }
    } catch (error) {
      showNotif('Error al sincronizar trabajadores: ' + error.message, 'error');
    } finally {
      setSyncingToMongo(false);
    }
  };

  const syncAttendanceToMongo = async () => {
    setSyncingToMongo(true);
    try {
      const pending = await getPendingRegistros();
      
      if (pending.length === 0) {
        showNotif('No hay registros pendientes para sincronizar', 'warning');
        return;
      }

      const result = await api.syncAttendanceToMongo(pending);
      if (result.success) {
        showNotif(`${result.message} - ${pending.length} asistencias respaldadas en MongoDB (permanecen en cola local)`, 'success');
      } else {
        showNotif(result.message, 'error');
      }
    } catch (error) {
      showNotif('Error al sincronizar asistencias: ' + error.message, 'error');
    } finally {
      setSyncingToMongo(false);
    }
  };

  const handleCleanDuplicates = async () => {
    try {
      const count = await cleanDuplicateRegistros();
      if (count > 0) {
        showNotif(`${count} ${t('settings.duplicatesRemoved')}`, 'success');
      } else {
        showNotif(t('settings.noDuplicates'), 'info');
      }
    } catch (error) {
      showNotif('Error al limpiar duplicados', 'error');
    }
  };

  const loadMongoWorkers = async () => {
    setLoadingMongo(true);
    try {
      const result = await api.getMongoWorkers();
      if (result.success) {
        setMongoWorkers(result.workers || []);
      } else {
        showNotif('Error al cargar trabajadores de MongoDB', 'error');
      }
    } catch (error) {
      showNotif('Error al conectar con MongoDB', 'error');
    } finally {
      setLoadingMongo(false);
    }
  };

  const loadMongoAttendance = async () => {
    setLoadingMongo(true);
    try {
      const result = await api.getMongoAttendance({ limit: 500 });
      if (result.success) {
        setMongoAttendance(result.records || []);
      } else {
        showNotif('Error al cargar asistencias de MongoDB', 'error');
      }
    } catch (error) {
      showNotif('Error al conectar con MongoDB', 'error');
    } finally {
      setLoadingMongo(false);
    }
  };

  const handleDeleteSelectedMongoWorkers = async () => {
    if (selectedMongoWorkers.size === 0) {
      showNotif('No hay trabajadores seleccionados', 'warning');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar ${selectedMongoWorkers.size} trabajador(es) de MongoDB? Esta acción NO se puede deshacer.`
    );

    if (!confirmDelete) return;

    setDeletingMongo(true);
    try {
      const workerNames = Array.from(selectedMongoWorkers);
      const result = await api.deleteMongoWorkers(workerNames);
      
      if (result.success) {
        showNotif(result.message, 'success');
        setSelectedMongoWorkers(new Set());
        await loadMongoWorkers();
      } else {
        showNotif(result.message, 'error');
      }
    } catch (error) {
      showNotif('Error al eliminar trabajadores: ' + error.message, 'error');
    } finally {
      setDeletingMongo(false);
    }
  };

  const handleDeleteSelectedMongoAttendance = async () => {
    if (selectedMongoAttendance.size === 0) {
      showNotif('No hay registros seleccionados', 'warning');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar ${selectedMongoAttendance.size} registro(s) de MongoDB? Esta acción NO se puede deshacer.`
    );

    if (!confirmDelete) return;

    setDeletingMongo(true);
    try {
      const clientIds = Array.from(selectedMongoAttendance);
      const result = await api.deleteMongoAttendance(clientIds);
      
      if (result.success) {
        showNotif(result.message, 'success');
        setSelectedMongoAttendance(new Set());
        await loadMongoAttendance();
      } else {
        showNotif(result.message, 'error');
      }
    } catch (error) {
      showNotif('Error al eliminar registros: ' + error.message, 'error');
    } finally {
      setDeletingMongo(false);
    }
  };

  const handleClearAllMongoWorkers = async () => {
    const confirmDelete = window.confirm(
      '⚠️ ADVERTENCIA: ¿Estás seguro de eliminar TODOS los trabajadores de MongoDB? Esta acción es IRREVERSIBLE.'
    );

    if (!confirmDelete) return;

    const doubleConfirm = window.confirm(
      '⚠️ ÚLTIMA CONFIRMACIÓN: ¿Realmente deseas eliminar TODOS los trabajadores de la nube?'
    );

    if (!doubleConfirm) return;

    setDeletingMongo(true);
    try {
      const result = await api.clearAllMongoWorkers();
      if (result.success) {
        showNotif(result.message, 'success');
        setSelectedMongoWorkers(new Set());
        await loadMongoWorkers();
      } else {
        showNotif(result.message, 'error');
      }
    } catch (error) {
      showNotif('Error: ' + error.message, 'error');
    } finally {
      setDeletingMongo(false);
    }
  };

  const handleClearAllMongoAttendance = async () => {
    const confirmDelete = window.confirm(
      '⚠️ ADVERTENCIA: ¿Estás seguro de eliminar TODOS los registros de asistencia de MongoDB? Esta acción es IRREVERSIBLE.'
    );

    if (!confirmDelete) return;

    const doubleConfirm = window.confirm(
      '⚠️ ÚLTIMA CONFIRMACIÓN: ¿Realmente deseas eliminar TODOS los registros de la nube?'
    );

    if (!doubleConfirm) return;

    setDeletingMongo(true);
    try {
      const result = await api.clearAllMongoAttendance();
      if (result.success) {
        showNotif(result.message, 'success');
        setSelectedMongoAttendance(new Set());
        await loadMongoAttendance();
      } else {
        showNotif(result.message, 'error');
      }
    } catch (error) {
      showNotif('Error: ' + error.message, 'error');
    } finally {
      setDeletingMongo(false);
    }
  };

  const isSupervisorOrAdmin = user?.role?.name === 'supervisor' || user?.role?.name === 'admin';
  const canSync = syncApprovalStatus?.can_sync || isSupervisorOrAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-campo-green-50 to-white pb-32">
      {showNotification && (
        <Notification
          message={notificationMessage}
          type={notificationType}
          onClose={() => setShowNotification(false)}
        />
      )}

      <div className="sticky top-0 bg-white shadow-md z-10">
        <div className="p-6 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="touch-area"
          >
            <ArrowLeft className="w-8 h-8 text-campo-green-600" />
          </button>
          <h1 className="text-3xl font-bold text-campo-green-700">
            {t('settings.title')}
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Panel de solicitudes pendientes - SOLO para supervisores y admins */}
        {isSupervisorOrAdmin && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 bg-blue-500">
              <div className="flex items-center gap-3 text-white">
                <Clock className="w-6 h-6" />
                <h2 className="text-xl font-bold">Solicitudes de Sincronización</h2>
              </div>
            </div>
            
            <div className="p-6">
              {loadingRequests ? (
                <p className="text-center text-gray-500">Cargando...</p>
              ) : pendingRequests.length === 0 ? (
                <p className="text-center text-gray-500">No hay solicitudes pendientes</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => {
                    const isExpanded = expandedRequestId === request.id;
                    const hasRecords = request.records_summary && request.records_summary.length > 0;
                    
                    return (
                      <div key={request.id} className="bg-gray-50 rounded-lg overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{request.requester}</p>
                              <p className="text-sm text-gray-500">
                                Solicitado: {new Date(request.requested_at).toLocaleString('es-ES')}
                              </p>
                              <p className="text-sm text-blue-600 font-semibold mt-1">
                                📋 {request.records_count || 0} registros para sincronizar
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproval(request.id, 'approve')}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleApproval(request.id, 'reject')}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                              </button>
                            </div>
                          </div>
                          
                          {hasRecords && (
                            <button
                              onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
                            >
                              {isExpanded ? '▼ Ocultar registros' : '▶ Ver registros detallados'}
                            </button>
                          )}
                        </div>
                        
                        {isExpanded && hasRecords && (
                          <div className="border-t border-gray-200 bg-white p-4 max-h-64 overflow-y-auto">
                            <div className="space-y-2">
                              {request.records_summary.map((record, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                  <div className="flex items-center gap-3">
                                    <span className="font-semibold text-gray-800">{record.workerName}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      record.type === 'entry' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {record.type === 'entry' ? 'Entrada' : 'Salida'}
                                    </span>
                                  </div>
                                  <div className="text-gray-600">
                                    {record.date} {record.time}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Idioma */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-campo-green-500">
            <div className="flex items-center gap-3 text-white">
              <Globe className="w-6 h-6" />
              <h2 className="text-xl font-bold">{t('settings.language')}</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            <button
              onClick={() => changeLanguage('es')}
              className={`w-full p-4 rounded-xl text-left font-semibold transition-all ${
                i18n.language === 'es'
                  ? 'bg-campo-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🇪🇸 {t('settings.spanish')}
            </button>
            
            <button
              onClick={() => changeLanguage('en')}
              className={`w-full p-4 rounded-xl text-left font-semibold transition-all ${
                i18n.language === 'en'
                  ? 'bg-campo-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🇬🇧 {t('settings.english')}
            </button>
          </div>
        </div>

        {/* Sincronización */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-campo-brown-500">
            <div className="flex items-center gap-3 text-white">
              <Upload className="w-6 h-6" />
              <h2 className="text-xl font-bold">{t('settings.sync')}</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Estado de aprobación */}
            {!isSupervisorOrAdmin && (
              <div className="mb-4">
                {syncApprovalStatus?.status === 'pending' && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">Esperando aprobación del supervisor</p>
                  </div>
                )}
                {syncApprovalStatus?.status === 'approved' && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">Sincronización aprobada - Válido por 1 hora</p>
                  </div>
                )}
                {syncApprovalStatus?.status === 'rejected' && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800">Solicitud rechazada</p>
                  </div>
                )}
              </div>
            )}

            {/* Botón para solicitar aprobación */}
            {!isSupervisorOrAdmin && !syncApprovalStatus?.can_sync && syncApprovalStatus?.status !== 'pending' && (
              <Button
                variant="outline"
                size="large"
                icon={Clock}
                onClick={requestSyncApproval}
                className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 mb-3"
              >
                Solicitar Aprobación para Sincronizar
              </Button>
            )}

            {/* Botón de sincronizar */}
            <Button
              variant="primary"
              size="large"
              icon={Upload}
              onClick={handleSync}
              disabled={syncing || !canSync}
              className="w-full"
            >
              {syncing ? t('common.loading') : t('settings.syncNow')}
            </Button>

            {!canSync && !isSupervisorOrAdmin && (
              <p className="text-sm text-gray-500 text-center">
                Necesitas aprobación del supervisor para sincronizar
              </p>
            )}

            <div className="text-center text-gray-600">
              <p className="text-sm">{t('settings.lastSync')}</p>
              <p className="font-semibold">{t('settings.never')}</p>
            </div>
          </div>
        </div>

        {/* Sincronización a MongoDB - Solo Admin y Supervisor */}
        {(user?.role?.name === 'admin' || user?.role?.name === 'supervisor') && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 bg-purple-600">
              <div className="flex items-center gap-3 text-white">
                <Upload className="w-6 h-6" />
                <h2 className="text-xl font-bold">Sincronizar a Nube (MongoDB)</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {mongoStatus && (
                <div className={`p-3 rounded-lg ${mongoStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <p className="text-sm font-semibold">{mongoStatus.message}</p>
                </div>
              )}

              {user?.role?.name === 'admin' && (
                <Button
                  variant="primary"
                  size="large"
                  icon={Upload}
                  onClick={syncWorkersToMongo}
                  disabled={syncingToMongo || !mongoStatus?.connected}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {syncingToMongo ? 'Sincronizando...' : 'Sincronizar Trabajadores a Nube'}
                </Button>
              )}

              {(user?.role?.name === 'supervisor' || user?.role?.name === 'admin') && (
                <Button
                  variant="primary"
                  size="large"
                  icon={Upload}
                  onClick={syncAttendanceToMongo}
                  disabled={syncingToMongo || !mongoStatus?.connected}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {syncingToMongo ? 'Sincronizando...' : 'Sincronizar Asistencias a Nube'}
                </Button>
              )}

              <p className="text-sm text-gray-600 text-center">
                {user?.role?.name === 'admin' 
                  ? 'Solo el Admin puede sincronizar trabajadores. Ambos pueden sincronizar asistencias.'
                  : 'Como Supervisor puedes sincronizar asistencias a la nube.'}
              </p>
            </div>
          </div>
        )}

        {/* Gestión de Datos en MongoDB - Solo Admin */}
        {user?.role?.name === 'admin' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 bg-orange-600">
              <div className="flex items-center gap-3 text-white">
                <Trash2 className="w-6 h-6" />
                <h2 className="text-xl font-bold">Gestionar Datos en MongoDB</h2>
              </div>
            </div>
            
            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setMongoTab('workers');
                    loadMongoWorkers();
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    mongoTab === 'workers'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Trabajadores
                </button>
                <button
                  onClick={() => {
                    setMongoTab('attendance');
                    loadMongoAttendance();
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    mongoTab === 'attendance'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Asistencias
                </button>
              </div>

              {/* Workers Tab */}
              {mongoTab === 'workers' && (
                <div>
                  {loadingMongo ? (
                    <p className="text-center text-gray-500 py-4">Cargando...</p>
                  ) : mongoWorkers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay trabajadores en MongoDB</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {mongoWorkers.map((worker, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                            selectedMongoWorkers.has(worker.name)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const newSelected = new Set(selectedMongoWorkers);
                            if (newSelected.has(worker.name)) {
                              newSelected.delete(worker.name);
                            } else {
                              newSelected.add(worker.name);
                            }
                            setSelectedMongoWorkers(newSelected);
                          }}
                        >
                          <p className="font-semibold text-gray-800">{worker.name}</p>
                          <p className="text-xs text-gray-500">Sincronizado: {worker.synced_at ? new Date(worker.synced_at).toLocaleString('es-ES') : 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {selectedMongoWorkers.size > 0 && (
                      <>
                        <p className="text-sm text-gray-600 text-center">
                          {selectedMongoWorkers.size} trabajador(es) seleccionado(s)
                        </p>
                        <Button
                          variant="primary"
                          size="medium"
                          icon={Trash2}
                          onClick={handleDeleteSelectedMongoWorkers}
                          disabled={deletingMongo}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          {deletingMongo ? 'Eliminando...' : `Eliminar ${selectedMongoWorkers.size} Trabajador(es) de MongoDB`}
                        </Button>
                      </>
                    )}
                    
                    {mongoWorkers.length > 0 && (
                      <Button
                        variant="outline"
                        size="small"
                        icon={Trash2}
                        onClick={handleClearAllMongoWorkers}
                        disabled={deletingMongo}
                        className="w-full border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Eliminar TODOS los Trabajadores
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Attendance Tab */}
              {mongoTab === 'attendance' && (
                <div>
                  {loadingMongo ? (
                    <p className="text-center text-gray-500 py-4">Cargando...</p>
                  ) : mongoAttendance.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay registros de asistencia en MongoDB</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {mongoAttendance.map((record, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                            selectedMongoAttendance.has(record.client_id)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            const newSelected = new Set(selectedMongoAttendance);
                            if (newSelected.has(record.client_id)) {
                              newSelected.delete(record.client_id);
                            } else {
                              newSelected.add(record.client_id);
                            }
                            setSelectedMongoAttendance(newSelected);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">{record.worker_name}</p>
                              <p className="text-sm text-gray-600">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  record.type === 'entry' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {record.type === 'entry' ? 'Entrada' : 'Salida'}
                                </span>
                              </p>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              <p>{record.date}</p>
                              <p>{record.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {selectedMongoAttendance.size > 0 && (
                      <>
                        <p className="text-sm text-gray-600 text-center">
                          {selectedMongoAttendance.size} registro(s) seleccionado(s)
                        </p>
                        <Button
                          variant="primary"
                          size="medium"
                          icon={Trash2}
                          onClick={handleDeleteSelectedMongoAttendance}
                          disabled={deletingMongo}
                          className="w-full bg-orange-600 hover:bg-orange-700"
                        >
                          {deletingMongo ? 'Eliminando...' : `Eliminar ${selectedMongoAttendance.size} Registro(s) de MongoDB`}
                        </Button>
                      </>
                    )}
                    
                    {mongoAttendance.length > 0 && (
                      <Button
                        variant="outline"
                        size="small"
                        icon={Trash2}
                        onClick={handleClearAllMongoAttendance}
                        disabled={deletingMongo}
                        className="w-full border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Eliminar TODOS los Registros
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mantenimiento */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-red-500">
            <div className="flex items-center gap-3 text-white">
              <Trash2 className="w-6 h-6" />
              <h2 className="text-xl font-bold">{t('settings.maintenance')}</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <Button
              variant="outline"
              size="large"
              icon={Trash2}
              onClick={handleCleanDuplicates}
              className="w-full border-red-500 text-red-600 hover:bg-red-50"
            >
              {t('settings.cleanDuplicates')}
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Elimina registros duplicados de entradas y salidas
            </p>
          </div>
        </div>

        {/* Acerca de */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gray-700">
            <div className="flex items-center gap-3 text-white">
              <Info className="w-6 h-6" />
              <h2 className="text-xl font-bold">{t('settings.about')}</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-campo-green-700 mb-2">FaceNomad</h3>
              <div className="inline-block px-4 py-1 bg-campo-green-100 rounded-full">
                <span className="text-campo-green-700 font-semibold">v1.5.0</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed text-center">
                {t('settings.description')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Versión</p>
                <p className="font-semibold text-gray-800">1.5.0</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Tecnología</p>
                <p className="font-semibold text-gray-800">OpenCV LBPH</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Modo Offline Completo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 right-6">
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
