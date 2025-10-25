import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera as CameraIcon, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Camera from '../components/Camera';
import Notification from '../components/Notification';
import { api } from '../services/api';

export default function CaptureScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [showCamera, setShowCamera] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const registrationType = location.state?.type || 'entry';

  const handleCapture = async (imageData) => {
    setProcessing(true);
    
    try {
      const result = await api.recognizeFace(imageData);
      
      if (!result.success) {
        setNotification({
          message: result.message || 'Error al procesar imagen',
          type: 'error'
        });
        setProcessing(false);
        return;
      }

      if (!result.face_detected) {
        setNotification({
          message: t('capture.noFaceDetected'),
          type: 'warning'
        });
        setProcessing(false);
        return;
      }

      if (!result.recognized) {
        setNotification({
          message: 'Trabajador no reconocido. Por favor regístrese primero.',
          type: 'warning'
        });
        setProcessing(false);
        setTimeout(() => navigate('/'), 2000);
        return;
      }
      
      navigate('/validation', { 
        state: { 
          worker: {
            id: result.worker_name,
            name: result.worker_name,
            photo: result.annotated_image || imageData,
            confidence: result.confidence
          },
          type: registrationType,
          timestamp: new Date()
        } 
      });
      
    } catch (error) {
      console.error('Error al reconocer rostro:', error);
      setNotification({
        message: 'Error de conexión con el servidor',
        type: 'error'
      });
      setProcessing(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {processing && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-white text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" />
            <p className="text-xl">Procesando reconocimiento facial...</p>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        {showCamera ? (
          <Camera 
            onCapture={handleCapture}
            onClose={handleClose}
            showPreview={!processing}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-campo-green-900">
            <div className="text-white text-center p-8">
              <CameraIcon className="w-24 h-24 mx-auto mb-4" />
              <p className="text-2xl font-medium mb-4">{t('capture.instruction')}</p>
              <Button
                variant="primary"
                size="large"
                onClick={() => setShowCamera(true)}
              >
                Activar Cámara
              </Button>
            </div>
          </div>
        )}
      </div>

      {!processing && (
        <div className="p-6 bg-gradient-to-t from-black to-transparent">
          <div className="text-center text-white text-sm mb-4">
            <p className="font-semibold">{t('capture.instruction')}</p>
            <p className="text-gray-300 mt-2">El sistema reconocerá automáticamente tu rostro</p>
          </div>
        </div>
      )}
    </div>
  );
}
