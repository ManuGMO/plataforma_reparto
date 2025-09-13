import { useEffect, useState } from "react";
import PedidoModal from "./PedidoModal";
import { getStatusColor, getStatusText, getStatusIcon } from "./PedidoModal";

export default function PedidosTabComprador() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ID del comprador (actualmente hardcodeado)
  const ID_COMPRADOR = 2;

  // Cargar pedidos
  useEffect(() => {
    const cargarPedidos = async (ID_COMPRADOR = 2) => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/pedidos/comprador/${ID_COMPRADOR}`);
        if (!response.ok) {
          throw new Error('Error al cargar pedidos');
        }
        const data = await response.json();
        setPedidos(data);
        console.log("aaa: ", data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar pedidos:", err);
        setError("Error al cargar pedidos");
      } finally {
        setLoading(false);
      }
    };

    cargarPedidos();
  }, []);

  const openModal = (pedido) => {
    setSelectedPedido(pedido);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPedido(null);
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Pedidos</h2>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Pedidos</h2>
        <div className="text-center py-8">
          <span className="text-6xl">😞</span>
          <p className="text-gray-600 mt-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Pedidos</h2>
        <div className="text-center py-8">
          <span className="text-6xl">📋</span>
          <p className="text-gray-600 mt-4">No tienes pedidos aún</p>
          <p className="text-sm text-gray-500 mt-2">Haz tu primer pedido</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Pedidos</h2>
        <div className="space-y-4">
          {pedidos.map(pedido => (
            <div 
              key={pedido.id} 
              className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openModal(pedido)}
            >
              <div className="flex justify-between items-start mb-3 text-gray-600">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">{getStatusIcon(pedido.estado)}</span>
                    Pedido #{pedido.id}
                  </h3>
                  <p className="text-sm text-gray-600">{pedido.fecha}</p>
                  {pedido.direccion && (
                    <p className="text-xs text-gray-500 mt-1">📍 {pedido.direccion}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.estado)}`}>
                  {getStatusText(pedido.estado)}
                </span>
              </div>
             
              <div className="space-y-2 mb-3">
                {pedido.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <span className="font-medium text-gray-700">{item.cantidad}x {item.nombre}</span>
                    </div>
                    <span className="text-green-600 font-semibold">${item.subtotal}</span>
                  </div>
                ))}
                {pedido.items.length > 3 && (
                  <p className="text-sm text-gray-500 text-center py-1 border-t">
                    +{pedido.items.length - 3} productos más
                  </p>
                )}
              </div>
             
              <div className="flex justify-between items-center pt-3 border-t">
                <div className="text-sm text-gray-600">
                  {pedido.items.length} producto{pedido.items.length !== 1 ? 's' : ''}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-green-600">Total: ${pedido.total}</span>
                  <span className="text-gray-400">→</span>
                </div>
              </div>

              {/* Información adicional según el estado */}
              {pedido.estado === 'en-camino' && (
                <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">🚲 Tu pedido está en camino</p>
                </div>
              )}
              {pedido.estado === 'preparando' && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-700">👨‍🍳 Tu pedido se está preparando</p>
                </div>
              )}
              {pedido.estado === 'entregado' && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">✅ Pedido entregado exitosamente</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
      </div>

      {/* Modal de Detalle del Pedido */}
      <PedidoModal 
        pedido={selectedPedido}
        showModal={showModal}
        onClose={closeModal}
      />
    </>
  );
}