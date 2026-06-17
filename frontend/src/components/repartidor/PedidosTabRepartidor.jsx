import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import OrderCard from './OrderCard';
import OrderDetailAndDelivery from './OrderDetailAndDelivery';

export default function PedidosTabRepartidor({ repartidorId, isOnline, setNewOrderNotification }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentView, setCurrentView] = useState('list');
  const [notification, setNotification] = useState('');
  const [maxDistance, setMaxDistance] = useState(() => {
    try { return Number(localStorage.getItem('repartidor_max_distance')) || 1000; } catch { return 1000; }
  });


  const API_URL = import.meta.env.VITE_API_URL;

  const { token } = useAuth();
  const navigate = useNavigate();

  const loadOrders = async (overrideDistance) => {
    if (!isOnline) {
      setOrders([]);
      setFilteredOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // pedir al backend ya filtrado por rutas (endpoint acepta repartidorId)
      const distance = typeof overrideDistance !== 'undefined' ? overrideDistance : maxDistance;

      const res = await axios.get(`${API_URL}/api/repartidor/pedidos/disponibles/${repartidorId}`,
        { params: distance ? { maxDistance: distance } : {} });
      const payload = res.data;

      const list = (payload && payload.success && Array.isArray(payload.data)) ? payload.data : (Array.isArray(payload) ? payload : (payload.data || []));
      setOrders(list);
      setFilteredOrders(list);

      // opción: notificar nuevo pedido (solo demo)
      if (list.length > 0 && Math.random() < 0.2) {
        const newOrder = list[0];
        setNewOrderNotification && setNewOrderNotification({ id: newOrder.id_pedido, pay: `$${newOrder.total}`, restaurant: newOrder.vendedor?.nombre || newOrder.Vendedor?.[0]?.nombre });
      }
    } catch (err) {
      console.error('Error loadOrders', err);
      if (err.response && err.response.status === 401) {
        setNotification('Sesión expirada. Redirigiendo a login...');
        navigate('/login');
        return;
      }
      setError(err.message || 'Error cargando pedidos');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [repartidorId, isOnline, maxDistance]);

  const updateOrderInState = (orderId, updates) => {
    setOrders(prev => prev.map(o => (o.id_pedido === orderId ? { ...o, ...updates } : o)));
    setFilteredOrders(prev => prev.map(o => (o.id_pedido === orderId ? { ...o, ...updates } : o)));
    setSelectedOrder(prev => (prev && prev.id_pedido === orderId ? { ...prev, ...updates } : prev));
  };

  // NOTE: los pedidos se filtran en backend por rutas/hora; no se aplican filtros en cliente.

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const diff = Date.now() - new Date(dateString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Hace unos segundos';
      if (mins < 60) return `Hace ${mins} minutos`;
      const hrs = Math.floor(mins / 60);
      return `Hace ${hrs} horas`;
    } catch { return ''; }
  };

  const handleViewOrder = (order) => {
    const fresh = orders.find(o => o.id_pedido === order.id_pedido) || order;
    setSelectedOrder(fresh);
    if (fresh.tiene_repartidor) setCurrentView('active_delivery');
    else setCurrentView('detail');
  };

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/repartidor/${orderId}/aceptar`, { id_repartidor: repartidorId });
      const data = res.data;
      if (data.success) {
        updateOrderInState(orderId, { tiene_repartidor: true, id_repartidor: repartidorId, ...data.pedido });
        setNotification('Pedido aceptado');
        setCurrentView('active_delivery');
        return true;
      }
      throw new Error(data.error || 'Error acep. pedido');
    } catch (err) {
      console.error(err);
      setNotification('Error al aceptar: ' + (err.message || ''));
      return false;
    } finally { setLoading(false); }
  };

  const handleConfirmPickup = async (orderId, vendorId) => {
    setLoading(true);
    try {
      const payload = { id_repartidor: repartidorId };
      if (vendorId) payload.vendorId = vendorId;

      const res = await axios.patch(`${API_URL}/api/repartidor/${orderId}/recoger`, payload);
      const data = res.data;
      if (data.success) {
        if (selectedOrder && selectedOrder.vendedores) {
          const nuevosVendedores = selectedOrder.vendedores.map(v =>
            v.id_usuario === vendorId ? { ...v, estado_pedido: 'en_reparto' } : v
          );
          const todosRecogidos = nuevosVendedores.every(v => ['en_reparto', 'entregado', 'rechazado', 'cancelado'].includes(v.estado_pedido));

          if (todosRecogidos || !vendorId) {
            updateOrderInState(orderId, { estado: 'en_reparto', vendedores: nuevosVendedores });
          } else {
            updateOrderInState(orderId, { vendedores: nuevosVendedores });
          }
        } else {
          updateOrderInState(orderId, { estado: 'en_reparto' });
        }
        setNotification('Recogida confirmada');
        return true;
      }
      throw new Error(data.error || 'Error confirmar recogida');
    } catch (err) { console.error(err); setNotification('Error: ' + (err.message || '')); return false; } finally { setLoading(false); }
  };

  const handleConfirmDelivery = async (orderId) => {
    setLoading(true);
    try {
      const res = await axios.patch(`${API_URL}/api/repartidor/${orderId}/entregar`, { id_repartidor: repartidorId });
      const data = res.data;
      if (data.success) {
        updateOrderInState(orderId, { estado: 'entregado' });
        setNotification('Entrega confirmada');
        setCurrentView('list');
        setSelectedOrder(null);
        await loadOrders();
        return true;
      }
      throw new Error(data.error || 'Error confirmar entrega');
    } catch (err) { console.error(err); setNotification('Error: ' + (err.message || '')); } finally { setLoading(false); }
  };

  const handleBackToList = () => { setCurrentView('list'); setSelectedOrder(null); };

  const NotificationBanner = () => (
    notification ? (
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <div className="flex justify-between items-center">
          <span>{notification}</span>
          <button onClick={() => setNotification('')} className="text-blue-700 font-bold">×</button>
        </div>
      </div>
    ) : null
  );

  if (!isOnline) return (
    <div className="p-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">😴</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Estás fuera de línea</h3>
      <p className="text-gray-500 text-sm">Activa tu disponibilidad para ver pedidos disponibles</p>
    </div>
  );

  if ((currentView === 'detail' || currentView === 'active_delivery') && selectedOrder) {
    return (
      <OrderDetailAndDelivery
        order={selectedOrder}
        currentView={currentView}
        onBack={handleBackToList}
        onAccept={handleAcceptOrder}
        onConfirmPickup={handleConfirmPickup}
        onConfirmDelivery={handleConfirmDelivery}
        notification={notification}
        setNotification={setNotification}
        loading={loading}
      />
    );
  }

  return (
    <div className="p-4">
      <NotificationBanner />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Pedidos Disponibles</h2>
      </div>

      <div className="space-y-4 mb-3 flex justify-between">
        <div className="flex items-center gap-3">
          <div className="text-gray-500 text-left flex flex-col">
            <div className='font-bold'>Rango (m)</div>
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1">

              <input type="range" min="200"
                max="5000"
                step="50"
                value={maxDistance} onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaxDistance(v);
                  try { localStorage.setItem('repartidor_max_distance', String(v)); } catch { }
                  // recargar con el valor inmediatamente
                  loadOrders(v);
                }} />

              <input className="w-16 p-1 border rounded text-xs bg-white" type="number" value={maxDistance} onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setMaxDistance(v);
                try { localStorage.setItem('repartidor_max_distance', String(v)); } catch { }
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className='mb-3 flex justify-center'>
        <button onClick={() => loadOrders()} disabled={loading} className={`flex items-center gap-2  py-2 rounded-lg border text-sm font-medium transition-colors ${loading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700'}`}>
          🔄 {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {/* Los pedidos se filtran en backend según rutas y horario del repartidor (no se muestran filtros aquí) */}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando pedidos...</p>
          </div>
        ) : !Array.isArray(filteredOrders) ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">❌</div>
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error en los datos</h3>
            <p className="text-red-600 text-sm">Los datos recibidos no tienen el formato esperado</p>
            <button onClick={loadOrders} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Reintentar</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay pedidos disponibles</h3>
            <p className="text-gray-500 text-sm">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.id_pedido} order={order} onViewOrder={handleViewOrder} timeAgo={formatTimeAgo(order.fecha_creacion)} />
          ))
        )}
      </div>
    </div>
  );
}
