import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Calendar, User, ArrowRight, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Notification from '../components/Notification';
import { addRegistro, checkDuplicateRegistro } from '../db/indexedDB';

export default function ValidationScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showNotification, setShowNotification] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const { worker, type, timestamp } = location.state || {};
  const hasSaved = useRef(false);

  useEffect(() => {
    if (!worker) {
      navigate('/');
      return;
    }

    if (hasSaved.current) {
      return;
    }

    const saveRegistro = async () => {
      const duplicateCheck = await checkDuplicateRegistro(worker.id, type);
      
      if (duplicateCheck.isDuplicate) {
        setDuplicateWarning({
          message: duplicateCheck.message,
          lastRegistro: duplicateCheck.lastRegistro
        });
        hasSaved.current = true;
        return;
      }
      
      await addRegistro({
        workerId: worker.id,
        workerName: worker.name,
        workerPhoto: worker.photo,
        type: type,
        date: timestamp.toLocaleDateString('es-ES'),
        time: timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      });
      setShowNotification(true);
      hasSaved.current = true;
    };

    saveRegistro();
  }, [worker, type, timestamp, navigate]);

  if (!worker) return null;

  const date = new Date(timestamp);

  return (
    <div className="min-h-screen bg-gradient-to-b from-campo-green-50 to-white flex flex-col items-center justify-center p-6">
      {showNotification && (
        <Notification
          message={t('common.savedLocally')}
          type="success"
          onClose={() => setShowNotification(false)}
        />
      )}
      
      {duplicateWarning && (
        <Notification
          message={duplicateWarning.message}
          type="error"
          onClose={() => setDuplicateWarning(null)}
        />
      )}

      <div className="w-full max-w-md">
        {duplicateWarning ? (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
            <div className="p-8 text-center bg-red-500">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-6xl">⚠️</span>
              </div>
              <h2 className="text-3xl font-bold text-white">
                Registro Duplicado
              </h2>
            </div>

            <div className="p-8">
              <div className="flex flex-col items-center mb-6">
                <img 
                  src={worker.photo} 
                  alt={worker.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-red-200 mb-4"
                />
                <h3 className="text-2xl font-bold text-gray-800">{worker.name}</h3>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <p className="text-red-800 font-semibold text-center text-lg">
                  {duplicateWarning.message}
                </p>
              </div>

              {duplicateWarning.lastRegistro && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Último registro:</p>
                  <div className="space-y-2">
                    <p className="text-gray-800">
                      <span className="font-semibold">Tipo:</span> {duplicateWarning.lastRegistro.type === 'entry' ? 'Entrada' : 'Salida'}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Fecha:</span> {duplicateWarning.lastRegistro.date}
                    </p>
                    <p className="text-gray-800">
                      <span className="font-semibold">Hora:</span> {duplicateWarning.lastRegistro.time}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
            <div className={`p-8 text-center ${
              type === 'entry' ? 'bg-campo-green-500' : 'bg-campo-brown-500'
            }`}>
              <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white">
                {type === 'entry' ? t('validation.entryRegistered') : t('validation.exitRegistered')}
              </h2>
            </div>

            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                <img 
                  src={worker.photo} 
                  alt={worker.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-campo-green-200 mb-4"
                />
                <h3 className="text-2xl font-bold text-gray-800">{worker.name}</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <User className="w-6 h-6 text-campo-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('validation.worker')}</p>
                    <p className="font-semibold text-lg">{worker.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-campo-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('validation.date')}</p>
                    <p className="font-semibold text-lg">
                      {date.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-6 h-6 text-campo-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t('validation.time')}</p>
                    <p className="font-semibold text-lg">
                      {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <ArrowRight className={`w-6 h-6 ${
                    type === 'entry' ? 'text-campo-green-600' : 'text-campo-brown-600'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-600">{t('validation.status')}</p>
                    <p className="font-semibold text-lg">
                      {type === 'entry' ? t('validation.entry') : t('validation.exit')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Button
            variant="primary"
            size="large"
            icon={RotateCcw}
            onClick={() => navigate('/')}
            className="w-full"
          >
            {t('validation.registerAnother')}
          </Button>

          <Button
            variant="outline"
            size="large"
            onClick={() => navigate('/')}
            className="w-full"
          >
            {t('validation.done')}
          </Button>
        </div>
      </div>
    </div>
  );
}
