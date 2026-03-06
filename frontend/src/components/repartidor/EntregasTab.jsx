import { useState, useEffect } from 'react';
import axios from 'axios';

export default function EntregasTab({ repartidorId }) {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalDistance: 0,
    totalEarnings: 0
  });
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const filterOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' }
  ];

  const buildUrl = () => {
    const base = `${API_URL}/api/repartidor/${repartidorId}/entregas`;
    if (fromDate && toDate) {
      return `${base}?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
    }
    return `${base}?filter=${encodeURIComponent(filter)}`;
  }

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const url = buildUrl();
      const response = await axios.get(url);
      const data = response.data;
      setDeliveries(data.deliveries || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Error al cargar entregas:", error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler para aplicar el filtro/rango inmediatamente (evita problemas de setState asincrónico)
  const handleApply = async () => {
    setLoading(true);
    try {
      const url = buildUrl();
      const response = await axios.get(url);
      const data = response.data;
      setDeliveries(data.deliveries || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error al aplicar filtro:', error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, [repartidorId, filter, fromDate, toDate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'entregado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'entregado':
        return 'Entregado';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-bold text-gray-900">Mis Entregas</h2>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setFromDate(''); setToDate(''); }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-36"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-36" />
            <span className="mx-1 text-gray-500">—</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-36" />
            <button onClick={handleApply} className="ml-2 px-3 py-1 bg-gray-100 rounded">Aplicar</button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando entregas...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay entregas</h3>
            <p className="text-gray-500 text-sm">Tus entregas completadas aparecerán aquí</p>
          </div>
        ) : (
          deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id_pedido}
              delivery={delivery}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              onClick={() => setSelectedDelivery(delivery)}
            />
          ))
        )}
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Resumen de Ganancias</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total entregas:</span>
            <span className="font-semibold text-gray-400">{stats.totalDeliveries}</span>
          </div>

          <div className="border-t pt-2 flex justify-between">
            <span className="text-lg font-semibold text-gray-900">Total ganado:</span>
            <span className="text-lg font-bold text-green-600">${stats.totalEarnings}</span>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Detalle de la Entrega</h3>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Comprador</p>
                <p className="font-medium">{selectedDelivery.Comprador?.[0]?.nombre || 'Cliente'}</p>
              </div>

              {selectedDelivery.valoracion ? (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Opinión del comprador</h4>
                  <div className="flex items-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`text-xl ${star <= selectedDelivery.valoracion.calificacion ? 'text-yellow-400' : 'text-gray-300'
                        }`}>★</span>
                    ))}
                    <span className="ml-2 text-blue-800 font-medium">
                      {selectedDelivery.valoracion.calificacion}/5
                    </span>
                  </div>
                  {selectedDelivery.valoracion.comentario && (
                    <p className="text-blue-800 text-sm italic">
                      "{selectedDelivery.valoracion.comentario}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-300 p-4 rounded-lg text-center">
                  <p className="text-gray-500 text-sm">El cliente aún no ha dejado una opinión para esta entrega.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDelivery(null)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryCard({ delivery, formatDate, getStatusColor, getStatusText, onClick }) {
  const vendorName = delivery.Vendedor?.[0]?.nombre || 'Restaurante';
  const customerName = delivery.Comprador?.[0]?.nombre || 'Cliente';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Pedido #{delivery.id_pedido}</h3>
          <p className="text-sm text-gray-600">{formatDate(delivery.fecha_creacion)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">${delivery.total}</p>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(delivery.estado)}`}>
            {getStatusText(delivery.estado)}
          </span>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p><span className="font-semibold text-gray-600">De:</span>
          <span className='text-gray-600'>  {vendorName}</span></p>
        <p><span className="font-semibold text-gray-600">Para:</span> <span className='text-gray-600'>{customerName}</span></p>
        <p><span className="font-semibold text-gray-600">Dirección:</span> <span className='text-gray-600'>{delivery.direccion}</span></p>
      </div>

      {/* Indicador visual si hay reseña */}
      {delivery.valoracion && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center text-xs text-yellow-600 font-medium">
          <span className="mr-1">★</span>
          Opinión del cliente disponible
        </div>
      )}
    </div>
  );
}