import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth';
import Logo from '../components/Logo';
import Button from '../components/Button';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-campo-green-50 to-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center animate-fade-in">
          <Logo size="large" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-campo-green-200">
          <h2 className="text-2xl font-bold text-campo-green-700 mb-6 text-center">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-campo-brown-700 font-semibold mb-2">
                <User className="w-5 h-5 inline mr-2" />
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-campo-green-300 rounded-lg focus:outline-none focus:border-campo-green-500 text-lg"
                placeholder="Ingrese su usuario"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-campo-brown-700 font-semibold mb-2">
                <Lock className="w-5 h-5 inline mr-2" />
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-campo-green-300 rounded-lg focus:outline-none focus:border-campo-green-500 text-lg"
                placeholder="Ingrese su contraseña"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">FaceNomad v1.5.0</p>
          <p className="text-xs text-gray-500 mt-1">Sistema de Reconocimiento Facial</p>
        </div>
      </div>
    </div>
  );
}
