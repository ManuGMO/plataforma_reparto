import { useEffect } from 'react';

export default function ReceiptDetailModal({ receipt, onClose, onApprove, onReject }) {
  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose} // Cerrar al clickar fuera del modal
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Evitar que clicks dentro cierren
      >
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Validar Comprobante</h3>
        </div>
        
        <div className="p-6 space-y-4">
            <div className="text-center">
            <img
              src={`http://localhost:3001/${receipt.comprobante_pago}`}
              alt="Comprobante"
              className="w-full max-w-2xl mx-auto rounded border"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Pedido</label>
              <p className="text-gray-900">#{receipt.id_pedido}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cliente</label>
              <p className="text-gray-900">{receipt.comprador_nombre || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <p className="text-gray-900">${receipt.total}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado Pedido</label>
              <p className="text-gray-900">{receipt.estado}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Pedido</label>
              <p className="text-gray-900">
                {new Date(receipt.fecha_creacion).toLocaleString('es-CL')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <p className="text-gray-900">{receipt.direccion || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={onClose}
              className="flex-1 mr-3 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cerrar
            </button>

            {/* Mostrar botones solo si existe comprobante y no está confirmado ni cancelado */}
            {receipt.comprobante_pago && !receipt.pago_confirmado && receipt.estado !== 'cancelado' ? (
              <div className="flex-1 flex space-x-3">
                <button
                  onClick={() => onReject(receipt.id_pedido)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => onApprove(receipt.id_pedido)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  Aprobar
                </button>
              </div>
            ) : (
              <div className="flex-1 text-right text-sm text-gray-600">
                {receipt.pago_confirmado ? (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-800">Pago aprobado</span>
                ) : receipt.estado === 'cancelado' ? (
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-800">Comprobante rechazado</span>
                ) : (
                  <span className="text-gray-500">No hay acciones disponibles</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}