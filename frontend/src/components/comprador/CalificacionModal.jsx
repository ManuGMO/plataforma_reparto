import { useState } from 'react';
import axios from 'axios';

export default function CalificacionModal({ pedido, showModal, onClose, id_comprador, onCalificacionEnviada }) {
  console.log('Pedido para calificar:', pedido);

  const [calificaciones, setCalificaciones] = useState({
    vendedor: { calificacion: 0, comentario: '' },
    repartidor: { calificacion: 0, comentario: '' }
  });
  const [enviando, setEnviando] = useState(false);
  const [hoveredStar, setHoveredStar] = useState({ vendedor: 0, repartidor: 0 });

  // Intentar extraer nombres desde el objeto `pedido` con varios fallbacks
  const vendedorNombre = typeof pedido?.vendedor === 'string'
    ? pedido.vendedor
    : pedido?.vendedor?.nombre || pedido?.vendedor_nombre || pedido?.items?.[0]?.vendedor || 'Vendedor desconocido';

  const repartidorNombre = typeof pedido?.repartidor === 'string'
    ? pedido.repartidor
    : pedido?.repartidor?.nombre || pedido?.repartidor_nombre || (pedido?.tiene_repartidor ? 'Repartidor asignado' : 'Sin repartidor');

  if (!showModal || !pedido) return null;

  const handleStarClick = (tipo, valor) => {
    setCalificaciones(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], calificacion: valor }
    }));
  };

  const handleComentarioChange = (tipo, valor) => {
    setCalificaciones(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], comentario: valor }
    }));
  };

  const handleEnviar = async () => {
    // Validar que al menos una calificación esté completa
    const tieneVendedor = calificaciones.vendedor.calificacion > 0;
    const tieneRepartidor = calificaciones.repartidor.calificacion > 0;

    if (!tieneVendedor && !tieneRepartidor) {
      alert('Por favor califica al menos al vendedor o al repartidor');
      return;
    }

    setEnviando(true);
    try {
      // Filtrar solo las calificaciones que tienen puntuación
      const calificacionesAEnviar = {
        vendedor: tieneVendedor ? calificaciones.vendedor : null,
        repartidor: tieneRepartidor ? calificaciones.repartidor : null
      };

      await axios.post('http://localhost:3001/api/pedidos/comprador/calificar', {
        id_pedido: pedido.id,
        id_comprador: id_comprador,
        calificaciones: calificacionesAEnviar
      });

      alert('Gracias por tu calificación');
      if (onCalificacionEnviada) onCalificacionEnviada();
      onClose();
    } catch (error) {
      console.error('Error al enviar calificación:', error);
      alert('Error al enviar la calificación. Por favor intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const renderEstrellas = (tipo) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hoveredStar[tipo] || calificaciones[tipo].calificacion);
          return (
            <button
              key={star}
              onClick={() => handleStarClick(tipo, star)}
              onMouseEnter={() => setHoveredStar(prev => ({ ...prev, [tipo]: star }))}
              onMouseLeave={() => setHoveredStar(prev => ({ ...prev, [tipo]: 0 }))}
              className="bg-transparent rounded-md p-1 w-9 h-9 flex items-center justify-center transition-all duration-150 outline-none ring-transparent focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:ring-transparent focus-visible:ring-transparent focus:border-transparent focus-visible:border-transparent active:outline-none"
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill={filled ? "#FCD34D" : "none"}
                stroke={filled ? "#FCD34D" : "#D1D5DB"}
                strokeWidth="2"
                className="transition-all duration-150"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Calificar experiencia
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tu opinión nos ayuda a mejorar el servicio
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Calificación Vendedor */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Vendedor</h3>
                <p className="text-sm text-gray-700 mt-1">{vendedorNombre}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-3">
              {renderEstrellas('vendedor')}
              {calificaciones.vendedor.calificacion > 0 && (
                <span className="text-sm text-gray-600">
                  {calificaciones.vendedor.calificacion}/5
                </span>
              )}
            </div>

            {calificaciones.vendedor.calificacion > 0 && (
              <textarea
                value={calificaciones.vendedor.comentario}
                onChange={(e) => handleComentarioChange('vendedor', e.target.value)}
                placeholder="Comentario (opcional)"
                rows="2"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none resize-none"
              />
            )}
          </div>

          {/* Calificación Repartidor */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Repartidor</h3>
                <p className="text-sm text-gray-700 mt-1">{repartidorNombre}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-3">
              {renderEstrellas('repartidor')}
              {calificaciones.repartidor.calificacion > 0 && (
                <span className="text-sm text-gray-600">
                  {calificaciones.repartidor.calificacion}/5
                </span>
              )}
            </div>

            {calificaciones.repartidor.calificacion > 0 && (
              <textarea
                value={calificaciones.repartidor.comentario}
                onChange={(e) => handleComentarioChange('repartidor', e.target.value)}
                placeholder="Comentario (opcional)"
                rows="2"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none resize-none"
              />
            )}
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={
                (calificaciones.vendedor.calificacion === 0 && calificaciones.repartidor.calificacion === 0) ||
                enviando
              }
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${(calificaciones.vendedor.calificacion === 0 && calificaciones.repartidor.calificacion === 0) || enviando
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {enviando ? 'Enviando...' : 'Enviar calificación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}