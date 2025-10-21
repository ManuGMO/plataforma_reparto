import React, { useEffect, useState } from 'react';
import OrderCard from './OrderCard';
import OrderDetailAndDelivery from './OrderDetailAndDelivery';

export default function PedidosTabRepartidor({ repartidorId, isOnline, setNewOrderNotification }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'detail' | 'active_delivery'
  const [notification, setNotification] = useState('');

  const loadOrders = async () => {
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
      const res = await fetch(`http://localhost:3001/api/repartidor/pedidos/disponibles/${repartidorId}`);
      const payload = await res.json();
      const list = (payload && payload.success && Array.isArray(payload.data)) ? payload.data : (Array.isArray(payload) ? payload : []);
      setOrders(list);
      setFilteredOrders(list);

      // opción: notificar nuevo pedido (solo demo)
      if (list.length > 0 && Math.random() < 0.2) {
        const newOrder = list[0];
        setNewOrderNotification && setNewOrderNotification({ id: newOrder.id_pedido, pay: `$${newOrder.total}`, restaurant: newOrder.vendedor?.nombre || newOrder.Vendedor?.[0]?.nombre || 'Restaurante' });
      }
    } catch (err) {
      console.error('Error loadOrders', err);
      setError(err.message || 'Error cargando pedidos');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [repartidorId, isOnline]);

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
      const res = await fetch(`http://localhost:3001/api/repartidor/${orderId}/aceptar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_repartidor: repartidorId }) });
      const data = await res.json();
      if (data.success) {
        updateOrderInState(orderId, { tiene_repartidor: true, id_repartidor: repartidorId, estado: 'listo_para_recoger' });
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

  const handleConfirmPickup = async (orderId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/repartidor/${orderId}/recoger`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_repartidor: repartidorId }) });
      const data = await res.json();
      if (data.success) {
        updateOrderInState(orderId, { estado: 'en_reparto' });
        setNotification('Recogida confirmada');
        return true;
      }
      throw new Error(data.error || 'Error confirmar recogida');
    } catch (err) { console.error(err); setNotification('Error: ' + (err.message || '')); return false; } finally { setLoading(false); }
  };

  const handleConfirmDelivery = async (orderId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/repartidor/${orderId}/entregar`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_repartidor: repartidorId }) });
      const data = await res.json();
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
        <button onClick={loadOrders} disabled={loading} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${loading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700'}`}>
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
