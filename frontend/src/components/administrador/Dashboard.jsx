import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    usuariosActivos: 0,
    ingresosTotales: 0,
    pedidosHoy: 0,
    comisionesTotales: 0
  });
  const [loading, setLoading] = useState(true);
  const [actividadReciente, setActividadReciente] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, actividadResponse] = await Promise.all([
        axios.get('http://localhost:3001/api/admin/dashboard/estadisticas'),
        axios.get('http://localhost:3001/api/admin/dashboard/actividad-reciente')
      ]);
      
      setStats(statsResponse.data);
      setActividadReciente(actividadResponse.data);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const statsConfig = [
    { 
      label: 'Usuarios Activos', 
      value: loading ? '...' : stats.usuariosActivos.toLocaleString(), 
      icon: '👥', 
      gradient: 'from-purple-500 to-purple-700' 
    },
    { 
      label: 'Pagos Totales', 
      value: loading ? '...' : formatCurrency(stats.ingresosTotales), 
      icon: '💰', 
      gradient: 'from-pink-500 to-red-500' 
    },
    { 
      label: 'Pedidos Hoy', 
      value: loading ? '...' : stats.pedidosHoy, 
      icon: '📦', 
      gradient: 'from-blue-400 to-cyan-400' 
    },
    { 
      label: 'Comisiones', 
      value: loading ? '...' : formatCurrency(stats.comisionesTotales), 
      icon: '📈', 
      gradient: 'from-green-400 to-teal-400' 
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Resumen general de la plataforma</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>
     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <span className="text-4xl opacity-80">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>
     
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          {loading ? (
            <p className="text-center text-gray-500 py-4">Cargando...</p>
          ) : actividadReciente.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay actividad reciente</p>
          ) : (
            <div className="space-y-4">
              {actividadReciente.map((actividad, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${actividad.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className={`${actividad.textColor} text-sm`}>{actividad.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{actividad.texto}</p>
                    <p className="text-xs text-gray-500">{actividad.tiempo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Estadísticas Adicionales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Sistema</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-medium text-blue-800">Total de Pedidos</span>
              </div>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {loading ? '...' : stats.totalPedidos}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <span className="text-sm font-medium text-green-800">Pedidos Entregados</span>
              </div>
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {loading ? '...' : stats.pedidosEntregados}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⏳</span>
                <span className="text-sm font-medium text-yellow-800">Pedidos Pendientes</span>
              </div>
              <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {loading ? '...' : stats.pedidosPendientes}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👥</span>
                <span className="text-sm font-medium text-purple-800">Total Usuarios</span>
              </div>
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {loading ? '...' : stats.totalUsuarios}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}