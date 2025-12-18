import { useEffect, useState } from "react";
import axios from "axios";

export default function FinanzasTab({ idUsuario}) {
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'pagado', 'pendiente'

  // 🔹 Obtener datos financieros
  useEffect(() => {
    const fetchFinanzas = async () => {
      try {
        setLoading(true);
        console.log("Obteniendo finanzas para vendedor ID:", idUsuario);
        
        const response = await axios.get(`http://localhost:3001/api/finanzas/${idUsuario}`);
        setHistorial(response.data.historial || []);
        setEstadisticas(response.data.estadisticas || {});
        console.log("Finanzas obtenidas:", response.data);
        
      } catch (error) {
        console.error("Error al obtener finanzas:", error);
        setHistorial([]);
        setEstadisticas({});
      } finally {
        setLoading(false);
      }
    };

    fetchFinanzas();
  }, [idUsuario]);

  // 🔹 Filtrar historial
  const historialFiltrado = historial.filter(pedido => {
    if (filtro === 'todos') return true;
    return pedido.estado_pago === filtro;
  });

  // 🔹 Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 🔹 Formatear moneda
  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Historial de Cobros</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Cargando información financiera...</p>
        </div>
      </div>
    );
  }

  const formatearEstado = (estado) => {
  const estados = {
    'pendiente': 'Pendiente',
    'aceptado': 'Aceptado', 
    'listo_para_recoger': 'Listo para recoger',
    'en_reparto': 'En reparto',
    'entregado': 'Entregado',
    'rechazado': 'Rechazado',
    'cancelado': 'Cancelado'
  };
  return estados[estado] || estado;
};

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Historial de Cobros</h2>
      
      {/* 📊 Resumen estadístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Total Pedidos</p>
          <p className="text-2xl font-bold text-blue-800">{estadisticas.totalPedidos || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Pagados</p>
          <p className="text-2xl font-bold text-green-800">{estadisticas.pedidosPagados || 0}</p>
          <p className="text-xs text-green-600">{formatearMoneda(estadisticas.montoTotalPagado || 0)}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-800">{estadisticas.pedidosPendientes || 0}</p>
          <p className="text-xs text-yellow-600">{formatearMoneda(estadisticas.montoPendiente || 0)}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{formatearMoneda(estadisticas.montoTotal || 0)}</p>
        </div>
      </div>

      {/* 🔍 Filtros */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-3 py-1 rounded text-sm ${
            filtro === 'todos' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos ({estadisticas.totalPedidos || 0})
        </button>
        <button
          onClick={() => setFiltro('pagado')}
          className={`px-3 py-1 rounded text-sm ${
            filtro === 'pagado' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pagados ({estadisticas.pedidosPagados || 0})
        </button>
        <button
          onClick={() => setFiltro('pendiente')}
          className={`px-3 py-1 rounded text-sm ${
            filtro === 'pendiente' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pendientes ({estadisticas.pedidosPendientes || 0})
        </button>
      </div>

      {/* 📋 Lista de pedidos */}
      {historialFiltrado.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay pedidos {filtro === 'todos' ? '' : filtro + 's'} para mostrar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historialFiltrado.map((pedido) => (
            <div
              key={pedido.id_pedido}
              className={`border rounded-lg p-4 shadow-sm ${
                pedido.estado_pago === 'pagado' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      Pedido #{pedido.id_pedido}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pedido.estado_pago === 'pagado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pedido.estado_pago === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 Fecha: {formatearFecha(pedido.fecha_pedido)}</p>
                    <p>📦 Estado: {formatearEstado(pedido.estado_pedido)}</p>
                    {pedido.fecha_entrega && (
                      <p>🚚 Entrega: {formatearFecha(pedido.fecha_entrega)}</p>
                    )}
                    {pedido.direccion && (
                      <p className="text-xs">📍 {pedido.direccion}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    {formatearMoneda(pedido.monto)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
        