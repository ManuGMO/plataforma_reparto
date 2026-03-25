import { useState, useEffect } from 'react';
import axios from 'axios';
import BlockUserModal from './BlockUserModal';
import UserRatingsModal from './UserRatingsModal';

export default function UsersManagement({ setNotification }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [blockModalUser, setBlockModalUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/usuarios`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setNotification('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || user.roles.includes(typeFilter);
    const matchesStatus = statusFilter === 'all' || user.estado === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleBlock = async (userId, reason) => {
    try {
      await axios.put(`${API_URL}/api/admin/usuarios/${userId}/bloquear`, {
        motivo: reason
      });
      setNotification('Usuario bloqueado correctamente');
      setBlockModalUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error al bloquear usuario:', error);
      setNotification('Error al bloquear usuario');
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await axios.put(`${API_URL}/api/admin/usuarios/${userId}/desbloquear`);
      setNotification('Usuario desbloqueado correctamente');
      fetchUsers();
    } catch (error) {
      console.error('Error al desbloquear usuario:', error);
      setNotification('Error al desbloquear usuario');
    }
  };

  const getRoleIcon = (roles) => {
    if (roles.includes('vendedor')) return '🏪';
    if (roles.includes('repartidor')) return '🚲';
    if (roles.includes('comprador')) return '🛒';
    return '👤';
  };

  const getRoleLabel = (rol) => {
    if (rol === 'comprador') return 'Comprador';
    if (rol === 'vendedor') return 'Vendedor';
    if (rol === 'repartidor') return 'Repartidor';
    return rol;
  };

  const getRoleColor = (rol) => {
    if (rol === 'vendedor') return 'bg-green-100 text-green-800';
    if (rol === 'repartidor') return 'bg-purple-100 text-purple-800';
    if (rol === 'comprador') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
        <p className="text-gray-600">Administrar usuarios, bloqueos y permisos</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900  "
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 "
          >
            <option value="all">Todos los tipos</option>
            <option value="comprador">Compradores</option>
            <option value="vendedor">Vendedores</option>
            <option value="repartidor">Repartidores</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 "
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="bloqueado">Bloqueados</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <span className="text-6xl">👥</span>
          <p className="text-gray-600 mt-4">No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr
                    key={user.id_usuario}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center bg-white border border-gray-500">
                          <span className="text-sm">{getRoleIcon(user.roles)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                          <div className="text-sm text-gray-500">{user.correo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(rol => (
                          <span key={rol} className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(rol)}`}>
                            {getRoleLabel(rol)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.estado === 'activo' ? 'Activo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.fecha_registro).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {user.estado === 'activo' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBlockModalUser(user);
                          }}
                          className="text-red-600 border-red-600 hover:border-red-900 hover:text-red-900 bg-white"
                        >
                          Bloquear
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnblock(user.id_usuario);
                          }}
                          className="text-green-600 border-green-600 hover:text-green-800 hover:text-green-800 bg-white"
                        >
                          Desbloquear
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {blockModalUser && (
        <BlockUserModal
          user={blockModalUser}
          onClose={() => setBlockModalUser(null)}
          onConfirm={handleBlock}
        />
      )}

      {selectedUser && (
        <UserRatingsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onBlock={(u) => {
            setSelectedUser(null);
            setBlockModalUser(u);
          }}
          onUnblock={(userId) => {
            handleUnblock(userId);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}