import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { t } = useTranslation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`fixed top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
      isOnline ? 'bg-campo-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {isOnline ? (
        <Wifi className="w-5 h-5" />
      ) : (
        <WifiOff className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">
        {isOnline ? t('common.online') : t('common.offline')}
      </span>
    </div>
  );
}
