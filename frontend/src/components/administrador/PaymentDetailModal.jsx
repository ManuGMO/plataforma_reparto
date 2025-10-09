import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PaymentDetailModal({ payment, onClose, onMarkAsPaid }) {
  const [detallePedidos, setDetallePedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetallePedidos();
  }, [payment.id_vendedor]);

  const fetchDetallePedidos = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/admin/pagos-vendedores/${payment.id_vendedor}/detalle`);
      setDetallePedidos(response.data);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">Detalle de Pagos - {payment.nombre_vendedor}</h3>
          <p className="text-sm text-gray-600">{payment.email_vendedor}</p>
        </div>
       
        <div className="p-6 space-y-4">
          {/* Resumen Financiero */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700">Total Pedidos</label>
              <p className="text-2xl font-bold text-gray-900">{payment.total_pedidos}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-blue-700">Precio Bruto</label>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(payment.total_precio_bruto)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-red-700">Comisiones</label>
              <p className="text-xl font-bold text-red-600">-{formatCurrency(payment.total_comisiones)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-orange-700">IVA Comisión</label>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(payment.iva_comision)}</p>
              <p className="text-xs text-gray-500 mt-1">19% de comisión</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-green-700">A Pagar</label>
              <p className="text-xl font-bold text-green-600">{formatCurrency(payment.monto_a_pagar)}</p>
            </div>
          </div>

         
          {/* Historial de Pedidos */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Historial de Pedidos</h4>
            {loading ? (
              <p className="text-center text-gray-500 py-4">Cargando...</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {detallePedidos.map(pedido => (
                  <div key={pedido.id_pedido} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">Pedido #{pedido.id_pedido}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          pedido.estado_pago === 'pagado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pedido.estado_pago}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(pedido.fecha_pedido).toLocaleDateString('es-CL')} - {pedido.direccion || 'Sin dirección'}
                      </p>
                      <p className="text-xs text-gray-600">Estado: {pedido.estado_pedido}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-900">Bruto: {formatCurrency(pedido.precio_bruto)}</p>
                      <p className="text-xs text-red-600">Comisión: -{formatCurrency(pedido.comision_servicio)}</p>
                      <p className="text-xs font-medium text-green-600">A pagar: {formatCurrency(pedido.monto_vendedor)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
         
          {/* Botones */}
          <div className="flex space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cerrar
            </button>
            {payment.pedidos_pendientes > 0 && (
              <button
                onClick={() => {
                  onMarkAsPaid(payment.id_vendedor);
                  onClose();
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
              >
                Marcar {payment.pedidos_pendientes} Pedidos como Pagados
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}