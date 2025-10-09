export default function DriverPaymentDetailModal({ payment, onClose, onMarkAsPaid }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Detalle de Liquidación - Repartidor</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Repartidor</label>
              <p className="text-gray-900">{payment.driver}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Período</label>
              <p className="text-gray-900">{payment.period}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Cálculo de Honorarios</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Entregas:</span>
                <span className="font-medium text-gray-900">{payment.deliveries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto Bruto:</span>
                <span className="font-medium text-gray-900">${payment.grossAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retención (14.5%):</span>
                <span className="text-red-600">-${payment.retentions}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium text-gray-900">Monto Neto:</span>
                <span className="font-bold text-green-600">${payment.netAmount}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Información Tributaria</h4>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Retención del 14.5% aplicada según normativa chilena<br/>
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium"
            >
              Cerrar
            </button>
            {payment.status === 'pending' && (
              <button
                onClick={() => onMarkAsPaid(payment.id)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium"
              >
                Marcar como Pagado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}