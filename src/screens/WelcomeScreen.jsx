import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, History, Settings, UserCog, Users, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth';
import Logo from '../components/Logo';
import Button from '../components/Button';
import ConnectionStatus from '../components/ConnectionStatus';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await authService.getUser();
    setUser(userData);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-campo-green-50 to-white flex flex-col">
      <ConnectionStatus />
      
      {/* Barra superior con usuario y botón de cerrar sesión */}
      {user && (
        <div className="bg-white border-b-2 border-campo-green-200 px-6 py-3 shadow-sm">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuario:</p>
              <p className="font-semibold text-campo-green-700">{user.username}</p>
              {user.role && <p className="text-xs text-gray-500">{user.role.name}</p>}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Cerrar
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="mb-12 animate-fade-in">
          <Logo size="large" />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Mensaje informativo para supervisores */}
          {user?.role?.name === 'supervisor' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-blue-700 mb-1">
                Modo Supervisor
              </p>
              <p className="text-xs text-blue-600">
                Solo puedes visualizar el historial de asistencias. No tienes permisos para registrar entradas o salidas.
              </p>
            </div>
          )}

          {/* Botones de registro de entrada/salida - OCULTOS para supervisores */}
          {user?.role?.name !== 'supervisor' && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="primary"
                size="large"
                icon={LogIn}
                onClick={() => navigate('/capture', { state: { type: 'entry' } })}
                className="w-full"
              >
                {t('welcome.registerEntry')}
              </Button>

              <Button
                variant="primary"
                size="large"
                icon={LogOut}
                onClick={() => navigate('/capture', { state: { type: 'exit' } })}
                className="w-full bg-campo-brown-500 hover:bg-campo-brown-600"
              >
                {t('welcome.registerExit')}
              </Button>
            </div>
          )}

          {/* Botones de gestión de trabajadores - SOLO para admins */}
          {user?.role?.name === 'admin' && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="large"
                icon={UserCog}
                onClick={() => navigate('/register')}
                className="w-full text-sm"
              >
                {t('welcome.registerWorker')}
              </Button>

              <Button
                variant="outline"
                size="large"
                icon={Users}
                onClick={() => navigate('/manage-workers')}
                className="w-full text-sm"
              >
                {t('welcome.manage')}
              </Button>
            </div>
          )}

          {/* Historial y Configuración - VISIBLE para todos */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="large"
              icon={History}
              onClick={() => navigate('/history')}
              className="w-full text-sm"
            >
              {t('welcome.history')}
            </Button>

            <Button
              variant="outline"
              size="large"
              icon={Settings}
              onClick={() => navigate('/settings')}
              className="w-full text-sm"
            >
              {t('welcome.settings')}
            </Button>
          </div>

          {/* Panel de administración - SOLO para admins */}
          {user?.role?.name === 'admin' && (
            <div className="mt-4">
              <Button
                variant="primary"
                size="large"
                icon={Shield}
                onClick={() => navigate('/admin')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Panel de Administración
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="text-center pb-8 text-campo-brown-600">
        <p className="text-xs text-gray-500 mb-1">FaceNomad</p>
        <p className="text-sm font-semibold">v1.5.0</p>
      </div>
    </div>
  );
}
