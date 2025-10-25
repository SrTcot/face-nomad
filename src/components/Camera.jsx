import { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon, X } from 'lucide-react';

export default function Camera({ onCapture, onClose, showPreview = true }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setHasPermission(true);
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Por favor verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleCapture = () => {
    const imageData = captureImage();
    if (imageData && onCapture) {
      onCapture(imageData);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-white text-center p-6">
            <CameraIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-lg">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-white text-black rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      <canvas ref={canvasRef} className="hidden" />

      {showPreview && hasPermission && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
            Cámara activa
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {showPreview && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handleCapture}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
            disabled={!hasPermission}
          >
            <div className="w-16 h-16 bg-campo-green-500 rounded-full"></div>
          </button>
        </div>
      )}
    </div>
  );
}
