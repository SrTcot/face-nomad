import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Notification({ message, type = 'success', onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: { bg: 'bg-campo-green-500', icon: CheckCircle },
    error: { bg: 'bg-red-500', icon: AlertCircle },
    warning: { bg: 'bg-yellow-500', icon: AlertCircle }
  };

  const { bg, icon: Icon } = types[type];

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
    }`}>
      <div className={`${bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]`}>
        <Icon className="w-6 h-6 flex-shrink-0" />
        <span className="text-lg font-medium flex-1">{message}</span>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="touch-area"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
