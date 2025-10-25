import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Camera from '../components/Camera';
import Notification from '../components/Notification';
import { api } from '../services/api';

export default function RegisterWorkerScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showCamera, setShowCamera] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
    setShowCamera(false);
  };

  const handleRegister = async () => {
    if (!workerName.trim()) {
      setNotification({
        message: 'Por favor ingrese el nombre del trabajador',
        type: 'warning'
      });
      return;
    }

    if (!capturedImage) {
      setNotification({
        message: 'Por favor capture una foto del trabajador',
        type: 'warning'
      });
      return;
    }

    setProcessing(true);

    try {
      const result = await api.registerWorker(capturedImage, workerName);

      if (result.success) {
        setNotification({
          message: t('register.success'),
          type: 'success'
        });
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setNotification({
          message: result.message || t('register.error'),
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error al registrar trabajador:', error);
      setNotification({
        message: error.message || 'Error de conexión con el servidor',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-campo-green-50 to-white">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {showCamera ? (
        <div className="min-h-screen bg-black">
          <Camera 
            onCapture={handleCapture}
            onClose={() => setShowCamera(false)}
          />
        </div>
      ) : (
        <>
          <div className="sticky top-0 bg-white shadow-md z-10">
            <div className="p-6 flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="touch-area"
              >
                <ArrowLeft className="w-8 h-8 text-campo-green-600" />
              </button>
              <h1 className="text-3xl font-bold text-campo-green-700">
                {t('register.title')}
              </h1>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-md mx-auto">
              <p className="text-lg text-gray-700 mb-8 text-center">
                {t('register.instruction')}
              </p>

              {capturedImage ? (
                <div className="mb-6">
                  <img 
                    src={capturedImage} 
                    alt="Captured"
                    className="w-full aspect-video object-cover rounded-2xl shadow-lg mb-4"
                  />
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => {
                      setCapturedImage(null);
                      setShowCamera(true);
                    }}
                    className="w-full"
                  >
                    Capturar Nueva Foto
                  </Button>
                </div>
              ) : (
                <div className="mb-6">
                  <div 
                    onClick={() => setShowCamera(true)}
                    className="w-full aspect-video bg-gray-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    <div className="text-center">
                      <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">Toca para capturar foto</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-lg font-semibold text-gray-700 mb-3">
                  {t('register.nameLabel')}
                </label>
                <input
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder={t('register.namePlaceholder')}
                  className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 focus:border-campo-green-500 text-lg"
                  disabled={processing}
                />
              </div>

              <Button
                variant="primary"
                size="large"
                icon={processing ? Loader2 : UserPlus}
                onClick={handleRegister}
                disabled={processing || !workerName.trim() || !capturedImage}
                className="w-full"
              >
                {processing ? 'Registrando...' : t('register.registerButton')}
              </Button>

              <Button
                variant="outline"
                size="large"
                icon={ArrowLeft}
                onClick={() => navigate('/')}
                className="w-full mt-4"
                disabled={processing}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
