import { useState } from 'react';
import CalificacionModal from './CalificacionModal';

export const getStatusColor = (estado) => {
  const colors = {
    'en-espera': 'bg-gray-300 text-gray-800',
    'confirmado': 'bg-blue-100 text-blue-800',
    'preparando': 'bg-yellow-100 text-yellow-800',
    'esperando-repartidor': 'bg-pink-100 text-pink-800',
    'en-camino': 'bg-purple-100 text-purple-800',
    'entregado': 'bg-green-100 text-green-800',
    'cancelado': 'bg-red-100 text-red-800'
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (estado) => {
  const texts = {
    'en-espera': 'En espera',
    'confirmado': 'Confirmado',
    'preparando': 'En preparación',
    'esperando-repartidor': 'Esperando Repartidor',
    'en-camino': 'En camino',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  };
  return texts[estado] || estado;
};

export const getStatusIcon = (estado) => {
  const icons = {
    'esperando-repartidor': '⏱️',
    'confirmado': '✅',
    'preparando': '👨‍🍳',
    'en-camino': '🚲',
    'entregado': '📦',
    'cancelado': '❌'
  };
  return icons[estado] || '📋';
};

export const getProgressStep = (estado) => {
  const steps = {
    'confirmado': 1,
    'preparando': 2,
    'esperando-repartidor': 2,
    'en-camino': 3,
    'entregado': 4,
    'cancelado': 0
  };
  return steps[estado] || 1;
};


export default function PedidoModal({ pedido, showModal, onClose }) {
  const [showCalificacionModal, setShowCalificacionModal] = useState(false);

  console.log("Informacion del pedido", pedido);

  if (!showModal || !pedido) return null;

  const handleCalificar = () => {
    setShowCalificacionModal(true);
  };

  const handleCalificacionEnviada = () => {
    // Opcional: recargar pedidos o actualizar estado
    console.log('Calificación enviada exitosamente');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={onClose}
              className="mr-3 text-2xl hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ←
            </button>
            <h1 className="text-lg font-bold text-gray-900">Detalle del Pedido</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Order Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Estado del pedido</h3>
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => {
                const currentStep = getProgressStep(pedido.estado);
                const isCompleted = step < currentStep;
                const isActive = step === currentStep;

                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Confirmado</span>
              <span>Preparando</span>
              <span>En camino</span>
              <span>Entregado</span>
            </div>
          </div>

          {/* Delivery Info - Solo mostrar si está en camino o entregado */}
          {(pedido.estado === 'en-camino' || pedido.estado === 'entregado') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Información del repartidor</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">👨‍🚴</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Repartidor</p>
                  <p className="text-sm text-gray-600">⭐ Valoracion del repartidor</p>
                  <p className="text-sm text-green-600">📱 numero de repartidor</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Información del pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha</span>
                <span className="font-medium text-gray-400">{pedido.fecha}</span>
              </div>
              {pedido.direccion && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección</span>
                  <span className="font-medium text-right text-gray-400">📍 {pedido.direccion}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-3">
              {pedido.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {item.cantidad}x ${item.precio} c/u
                    </p>
                    {item.vendedor && (
                      <p className="text-xs text-gray-500">Vendedor: {item.vendedor}</p>
                    )}
                  </div>
                  <span className="font-semibold text-green-600">${item.subtotal}</span>
                </div>
              ))}

              {/* Resumen de costos */}
              <div className="border-t pt-3 mt-3 space-y-2">

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${pedido.subtotal ?? pedido.items.reduce((sum, item) => sum + item.subtotal, 0)}</span>
                </div>

                {/* Comisión */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Comisión servicio</span>
                  <span className="text-gray-900">${pedido.comision ?? (pedido.total - (pedido.subtotal ?? pedido.items.reduce((sum, item) => sum + item.subtotal, 0)))}</span>
                </div>

                {/* Pago reparto */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pago reparto</span>
                  <span className="text-gray-900">${pedido.precio_reparto ?? 0}</span>
                </div>

                {/* Total final */}
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="font-semibold text-lg text-gray-900">Total</span>
                  <span className="font-bold text-lg text-green-600">${pedido.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rate Order Button - Solo mostrar si está entregado y no ha sido calificado */}
          {pedido.estado === 'entregado' && !pedido.ya_calificado && (
            <button
              onClick={handleCalificar}
              className="w-full bg-yellow-500 text-white py-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
            >
              ⭐ Calificar Experiencia
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
        <CalificacionModal
          pedido={pedido}
          showModal={showCalificacionModal}
          onClose={() => setShowCalificacionModal(false)}
          id_comprador={pedido.id_comprador}
          onCalificacionEnviada={handleCalificacionEnviada}
        />
      </div>
    </div>
  );
}