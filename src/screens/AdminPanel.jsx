import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Trash2, Edit, Shield, ArrowLeft, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/auth';
import { api } from '../services/api';
import Button from '../components/Button';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role_id: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, statsData, userData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getStats(),
        authService.getUser()
      ]);
      
      if (usersData.success) setUsers(usersData.users);
      if (rolesData.success) setRoles(rolesData.roles);
      if (statsData.success) setStats(statsData.stats);
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const result = await api.createUser(formData);
      if (result.success) {
        await loadData();
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert(error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const result = await api.updateUser(editingUser.id, updateData);
      if (result.success) {
        await loadData();
        setEditingUser(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert(error.message);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setShowCreateForm(false);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role_id: user.role?.id || '',
      is_active: user.is_active
    });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role_id: '',
      is_active: true
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    resetForm();
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    try {
      const result = await api.deleteUser(userId);
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-campo-green-500 mx-auto"></div>
          <p className="mt-4 text-campo-brown-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-campo-green-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => navigate('/')}
            >
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-campo-green-700">Panel de Administración</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Usuario:</p>
              <p className="font-semibold text-campo-green-700">{currentUser?.username}</p>
              <p className="text-xs text-gray-500">{currentUser?.role?.name}</p>
            </div>
            <Button
              variant="outline"
              icon={LogOut}
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Salir
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-campo-green-200">
              <p className="text-gray-600 text-sm">Trabajadores</p>
              <p className="text-3xl font-bold text-campo-green-700">{stats.total_workers}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-campo-green-200">
              <p className="text-gray-600 text-sm">Usuarios</p>
              <p className="text-3xl font-bold text-campo-green-700">{stats.total_users}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-campo-green-200">
              <p className="text-gray-600 text-sm">Registros Totales</p>
              <p className="text-3xl font-bold text-campo-green-700">{stats.total_records}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-campo-green-200">
              <p className="text-gray-600 text-sm">Registros Hoy</p>
              <p className="text-3xl font-bold text-campo-green-700">{stats.today_records}</p>
            </div>
          </div>
        )}

        {/* Gestión de Usuarios */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-campo-green-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-campo-green-700 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gestión de Usuarios
            </h2>
            {!editingUser && (
              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  if (!showCreateForm) resetForm();
                }}
              >
                {showCreateForm ? 'Cancelar' : 'Nuevo Usuario'}
              </Button>
            )}
          </div>

          {/* Formulario de Creación */}
          {showCreateForm && !editingUser && (
            <form onSubmit={handleCreateUser} className="mb-8 p-6 bg-campo-green-50 rounded-lg border-2 border-campo-green-200">
              <h3 className="text-lg font-bold text-campo-green-700 mb-4">Crear Nuevo Usuario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Usuario *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-campo-green-300 rounded-lg focus:outline-none focus:border-campo-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-campo-green-300 rounded-lg focus:outline-none focus:border-campo-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-campo-green-300 rounded-lg focus:outline-none focus:border-campo-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-campo-green-300 rounded-lg focus:outline-none focus:border-campo-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Rol *
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-campo-green-300 rounded-lg focus:outline-none focus:border-campo-green-500"
                    required
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2 w-5 h-5"
                    />
                    <span className="text-campo-brown-700 font-semibold">Usuario Activo</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                <Button type="submit" variant="primary">
                  Crear Usuario
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Formulario de Edición */}
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
              <h3 className="text-lg font-bold text-blue-700 mb-4">
                Editar Usuario: {editingUser.username}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Usuario *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Contraseña (dejar vacío para no cambiar)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Nueva contraseña (opcional)"
                  />
                </div>
                
                <div>
                  <label className="block text-campo-brown-700 font-semibold mb-2 text-sm">
                    Rol *
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2 w-5 h-5"
                    />
                    <span className="text-campo-brown-700 font-semibold">Usuario Activo</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                <Button type="submit" variant="primary">
                  Guardar Cambios
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {/* Lista de Usuarios */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-campo-green-200">
                  <th className="text-left py-3 px-4 text-campo-brown-700">Usuario</th>
                  <th className="text-left py-3 px-4 text-campo-brown-700">Email</th>
                  <th className="text-left py-3 px-4 text-campo-brown-700">Nombre</th>
                  <th className="text-left py-3 px-4 text-campo-brown-700">Rol</th>
                  <th className="text-left py-3 px-4 text-campo-brown-700">Estado</th>
                  <th className="text-left py-3 px-4 text-campo-brown-700">Último Acceso</th>
                  <th className="text-right py-3 px-4 text-campo-brown-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-campo-green-50">
                    <td className="py-3 px-4 font-mono text-sm">{user.username}</td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.full_name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-campo-green-100 text-campo-green-700 rounded-full text-xs font-semibold">
                        <Shield className="w-3 h-3" />
                        {user.role?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <span className="text-green-600 font-semibold text-sm">Activo</span>
                      ) : (
                        <span className="text-red-600 font-semibold text-sm">Inactivo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.last_login ? new Date(user.last_login).toLocaleString('es-ES') : 'Nunca'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Editar usuario"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 p-2"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
