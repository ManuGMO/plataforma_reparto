import { useState, useEffect } from 'react';

export default function PedidosTabRepartidor({ repartidorId, isOnline, setNewOrderNotification }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'active_delivery'
  const [notification, setNotification] = useState('');

  const loadOrders = async () => {
    if (!isOnline) {
      setOrders([]);
      setFilteredOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      console.log('Cargando pedidos para repartidorId:', repartidorId);

      const response = await fetch(`http://localhost:3001/api/repartidor/pedidos/disponibles`);
      const responseData = await response.json();

      let ordersData = [];
      
      if (responseData) {
        if (responseData.success && Array.isArray(responseData.data)) {
          ordersData = responseData.data;
        } else if (Array.isArray(responseData)) {
          ordersData = responseData;
        } else if (responseData.pedidos && Array.isArray(responseData.pedidos)) {
          ordersData = responseData.pedidos;
        }
      }

      console.log('Pedidos procesados:', ordersData);

      const safeOrdersData = Array.isArray(ordersData) ? ordersData : [];
      
      setOrders(safeOrdersData);
      setFilteredOrders(safeOrdersData);

      // Notificación de nuevo pedido
      if (safeOrdersData.length > 0 && Math.random() < 0.3) {
        const newOrder = safeOrdersData[0];
        setNewOrderNotification({
          id: newOrder.id_pedido,
          pay: `$${newOrder.total}`,
          restaurant: newOrder.vendedor?.nombre || newOrder.Vendedor?.[0]?.nombre || 'Restaurante'
        });
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      setError(error.message || 'Error al cargar pedidos');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [repartidorId, isOnline]);

  const applyFilter = (filterId) => {
    setActiveFilter(filterId);
    
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    switch (filterId) {
      case 'nearby':
        filtered = orders.filter(() => Math.random() <= 0.5);
        break;
      case 'route':
        filtered = orders.filter(() => Math.random() > 0.5);
        break;
      case 'high-pay':
        filtered = orders.filter((o) => parseInt(o.total) >= 5000);
        break;
      default:
        filtered = orders;
    }

    setFilteredOrders(filtered);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Tiempo desconocido";
    
    try {
      const now = new Date();
      const orderDate = new Date(dateString);
      const diffMinutes = Math.floor((now - orderDate) / (1000 * 60));
      if (diffMinutes < 1) return "Hace unos segundos";
      if (diffMinutes === 1) return "Hace 1 minuto";
      if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours === 1) return "Hace 1 hora";
      return `Hace ${diffHours} horas`;
    } catch (e) {
      return "Tiempo desconocido";
    }
  };


  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    
    // Determinar qué vista mostrar según el estado del pedido
    if (order.estado === 'listo_para_recoger' && !order.tiene_repartidor) {
      setCurrentView('detail');
    } else if (order.tiene_repartidor && ['listo_para_recoger', 'en_reparto'].includes(order.estado)) {
      setCurrentView('active_delivery');
    } else {
      setCurrentView('detail');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/repartidor/${orderId}/aceptar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_repartidor: repartidorId })
      });

      const data = await response.json();

      if (data.success) {
        setNotification('Pedido aceptado exitosamente');
        setCurrentView('active_delivery');
        const updatedOrder = { ...selectedOrder, tiene_repartidor: true };
        setSelectedOrder(updatedOrder);
        await loadOrders();
        return true;   // 👈 ÉXITO
      } else {
        throw new Error(data.error || 'Error al aceptar pedido');
      }
    } catch (error) {
      console.error('Error al aceptar pedido:', error);
      setNotification('Error al aceptar pedido: ' + error.message);
      return false;   // 👈 ERROR
    } finally {
      setLoading(false);
    }
  };


  const handleConfirmPickup = async (orderId) => {
  try {
    setLoading(true);
    const response = await fetch(`http://localhost:3001/api/repartidor/${orderId}/recoger`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_repartidor: repartidorId })
    });

    const data = await response.json();

    if (data.success) {
      setNotification('Recogida confirmada');
      const updatedOrder = { ...selectedOrder, estado: 'en_reparto' };
      setSelectedOrder(updatedOrder);
      await loadOrders();
      return true;   // 👈 ÉXITO
    } else {
      throw new Error(data.error || 'Error al confirmar recogida');
    }
  } catch (error) {
    console.error('Error al confirmar recogida:', error);
    setNotification('Error al confirmar recogida: ' + error.message);
    return false;   // 👈 ERROR
  } finally {
    setLoading(false);
  }
};




  const handleConfirmDelivery = async (orderId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/repartidor/${orderId}/entregar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_repartidor: repartidorId
        })
      });

      const data = await response.json();

      if (data.success) {
        setNotification('Entrega confirmada exitosamente');
        setCurrentView('list');
        setSelectedOrder(null);
        await loadOrders();
      } else {
        throw new Error(data.error || 'Error al confirmar entrega');
      }
    } catch (error) {
      console.error('Error al confirmar entrega:', error);
      setNotification('Error al confirmar entrega: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedOrder(null);
  };

  // Componente de notificación
  const NotificationBanner = () => {
    if (!notification) return null;
    
    return (
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <div className="flex justify-between items-center">
          <span>{notification}</span>
          <button onClick={() => setNotification('')} className="text-blue-700 font-bold">×</button>
        </div>
      </div>
    );
  };

  if (!isOnline) {
    return (
      <div className="p-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">😴</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Estás fuera de línea</h3>
        <p className="text-gray-500 text-sm">Activa tu disponibilidad para ver pedidos disponibles</p>
      </div>
    );
  }

  // Vista de detalle/entrega activa
  if (currentView === 'detail' || currentView === 'active_delivery') {
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

  // Vista de lista
  return (
    <div className="p-4">
      <NotificationBanner />
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Pedidos Disponibles</h2>
        <button
          onClick={loadOrders}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
            ${loading
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700"
            }`}
        >
          🔄 {loading ? "Cargando..." : "Actualizar"}
        </button>

      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar pedidos</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'nearby', label: 'Cerca' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => applyFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeFilter === filter.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

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
            <button 
              onClick={loadOrders} 
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay pedidos disponibles</h3>
            <p className="text-gray-500 text-sm">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id_pedido}
              order={order}
              onViewOrder={handleViewOrder}
              timeAgo={formatTimeAgo(order.fecha_creacion)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onViewOrder, timeAgo }) {
  const vendorName = order.vendedor?.nombre || 
                     order.Vendedor?.[0]?.nombre || 
                     (Array.isArray(order.Vendedor) && order.Vendedor.length > 0 ? order.Vendedor[0].nombre : null) ||
                     'Restaurante';
  
  const customerName = order.comprador?.nombre || 
                       order.Comprador?.[0]?.nombre || 
                       (Array.isArray(order.Comprador) && order.Comprador.length > 0 ? order.Comprador[0].nombre : null) ||
                       'Cliente';
  
  const itemCount = order.productos?.length || 
                    order.Productos?.length || 
                    order.Producto?.length || 
                    0;

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'listo_para_recoger': return 'bg-green-100 text-green-800';
      case 'en_reparto': return 'bg-blue-100 text-blue-800';
      case 'entregado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'listo_para_recoger': return 'Listo para recoger';
      case 'en_reparto': return 'En reparto';
      case 'entregado': return 'Entregado';
      default: return estado;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewOrder && onViewOrder(order)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Pedido #{order.id_pedido}</h3>
          <p className="text-sm text-gray-600">{timeAgo}</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(order.estado)}`}>
            {getStatusText(order.estado)}
          </span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">${order.total || 0}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-sm text-gray-700 font-medium">Recoger: {vendorName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-sm text-gray-700 font-medium">Entregar: {customerName}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">{itemCount} productos</span>
        <span className="text-blue-600 font-medium">Ver detalles →</span>
      </div>
    </div>
  );
}

function OrderDetailAndDelivery({ order, currentView, onBack, onAccept, onConfirmPickup, onConfirmDelivery, notification, setNotification, loading }) {
  const [currentStep, setCurrentStep] = useState(() => {
    if (!order.tiene_repartidor) return 1; // Disponible para aceptar
    if (order.estado === 'listo_para_recoger') return 2; // Listo para recoger
    if (order.estado === 'en_reparto') return 3; // En reparto
    return 1;
  });

  if (!order) return null;

  const vendorName = order.Vendedor?.[0]?.nombre || order.vendedor?.nombre || 'Restaurante';
  const customerName = order.Comprador?.[0]?.nombre || order.comprador?.nombre || 'Cliente';

  const steps = [
    { id: 1, label: 'Disponible', icon: '1' },
    { id: 2, label: 'Recoger', icon: '2' },
    { id: 3, label: 'Entregar', icon: '3' }
  ];

  const getCurrentAction = () => {
    if (!order.tiene_repartidor) {
      return {
        text: `Acepta este pedido para comenzar el reparto`,
        address: '',
        button: '🚚 Aceptar Pedido',
        action: 'accept'
      };
    }
    
    switch (currentStep) {
      case 2:
        return {
          text: `Dirígete a recoger el pedido en ${vendorName}`,
          address: 'Av. Principal 123',
          button: '📦 Confirmar Recogida',
          action: 'pickup'
        };
      case 3:
        return {
          text: `Entregar pedido a ${customerName}`,
          address: order.direccion || 'Dirección del cliente',
          button: '✅ Confirmar Entrega',
          action: 'delivery'
        };
      default:
        return {
          text: 'Entrega completada',
          address: '',
          button: 'Finalizar',
          action: 'complete'
        };
    }
  };

  const handleAction = async () => {
    const currentAction = getCurrentAction();
    let success = false;

    switch (currentAction.action) {
      case 'accept':
        success = await onAccept(order.id_pedido);
        if (success) setCurrentStep(2);
        break;
      case 'pickup':
        success = await onConfirmPickup(order.id_pedido);
        if (success) setCurrentStep(3);
        break;
      case 'delivery':
        success = await onConfirmDelivery(order.id_pedido);
        break;

    }
  };

  const contactSeller = () => {
    setNotification('Función de llamada no implementada');
  };

  const contactCustomer = () => {
    setNotification('Función de llamada no implementada');
  };

  const reportProblem = () => {
    setNotification('Función de reporte no implementada');
  };

  const currentAction = getCurrentAction();

  return (
    <div className="min-h-screen bg-white">
      {/* Notificación */}
      {notification && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3">
          <div className="flex justify-between items-center">
            <span>{notification}</span>
            <button onClick={() => setNotification('')} className="text-blue-700 font-bold">×</button>
          </div>
        </div>
      )}

      <header className="bg-green-600 text-white">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={onBack} className="mr-3 text-white">
                ← Volver
              </button>
              <div>
                <h1 className="text-lg font-bold">
                  {!order.tiene_repartidor ? 'Pedido Disponible' : 'Entrega en Progreso'}
                </h1>
                <p className="text-green-100 text-sm">Pedido #{order.id_pedido}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${order.total}</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="p-4 space-y-6">
        {/* Progress Steps - Solo mostrar si el pedido ya está aceptado */}
        {order.tiene_repartidor && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="step-item flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        step.id <= currentStep 
                          ? step.id === 1 
                            ? 'bg-green-600 text-white' 
                            : step.id === currentStep 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step.id <= currentStep && step.id !== currentStep ? '✓' : step.icon}
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`} style={{width: '50px'}}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Order Details */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Detalles del Pedido</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Recoger en:</p>
              <p className="font-medium text-gray-500">{vendorName}</p>
              <p className="text-sm text-gray-500">📍 Direccion</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Entregar a:</p>
              <p className="font-medium text-gray-500">{customerName}</p>
              <p className="text-sm text-gray-500">📍 {order.direccion || 'Dirección del cliente'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Productos:</p>
              <div className="space-y-1">
                {order.Productos?.map((producto, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-400">
                    <span>{producto.nombre}</span>
                    <span>x{producto.Producto_Pedido?.cantidad || 1}</span>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">Cargando productos...</p>
                )}
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-green-600">${order.total}</span>
              </div>
            </div>
          </div>
        </div>
        
        
        {/* Action Button */}
        <button 
          onClick={handleAction}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Procesando...' : currentAction.button}
        </button>
        

      </div>
    </div>
  );
}