import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DriverPaymentDetailModal({ payment, onClose, onMarkAsPaid }) {
  // payment es ahora un objeto driver: { id, driver, email, weeks: [...] }
  const [detalle, setDetalle] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(payment.defaultWeek || null);

  const fetchDetalle = async (week) => {
    try {
      const weekStart = week?.weekStart;
      const url = weekStart
        ? `http://localhost:3001/api/admin/pagos-repartidores/${payment.id}/detalle?weekStart=${weekStart}`
        : `http://localhost:3001/api/admin/pagos-repartidores/${payment.id}/detalle`;
      const res = await axios.get(url);
      setDetalle(res.data);
    } catch (err) {
      console.error('Error cargando detalle de la semana', err);
      setDetalle([]);
    }
  };

  useEffect(() => {
    // initial load for defaultWeek
    fetchDetalle(selectedWeek);
  }, [payment]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Detalle de Liquidación - Repartidor</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700">Repartidor</label>
              <p className="text-gray-900">{payment.driver}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 ">Semana</label>
              <div className="mt-1 ">
                <select
                  value={selectedWeek?.weekStart || ''}
                  onChange={(e) => {
                    const ws = e.target.value;
                    const week = payment.weeks.find(w => w.weekStart === ws) || null;
                    setSelectedWeek(week);
                    fetchDetalle(week);
                  }}
                  className="border rounded px-3 py-2 text-sm bg-gray-50 text-gray-900"
                >
                  {payment.weeks && payment.weeks.length > 0 ? (
                    payment.weeks.slice().sort((a,b) => b.weekStart.localeCompare(a.weekStart)).map(w => (
                      <option key={w.weekStart} value={w.weekStart}>{w.period}</option>
                    ))
                  ) : (
                    <option value="">Sin semanas</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Cálculo de Honorarios</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Entregas:</span>
                <span className="font-medium text-gray-900">{selectedWeek?.deliveries ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto Bruto:</span>
                <span className="font-medium text-gray-900">${selectedWeek?.grossAmount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Retención (14.5%):</span>
                <span className="text-red-600">-${selectedWeek?.retentions ?? 0}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium text-gray-900">Monto Neto:</span>
                <span className="font-bold text-green-600">${selectedWeek?.netAmount ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Pedidos de la semana</h4>
            <div className="space-y-2">
              {detalle.length === 0 ? (
                <p className="text-sm text-gray-600">No hay pedidos para esta semana</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {detalle.map(d => (
                    <li key={d.id_pedido} className="py-2 flex justify-between text-sm text-gray-700">
                      <div>
                        <div className="font-medium">Pedido #{d.id_pedido}</div>
                        <div className="text-xs text-gray-500">{new Date(d.fecha_pedido).toLocaleString()}</div>
                        <div className="text-xs">{d.direccion}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${Math.round(Number(d.pago_reparto || 0))}</div>
                        <div className="text-xs text-gray-500">{d.estado_pedido}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
            {selectedWeek && selectedWeek.status !== 'paid' ? (
              <button
                onClick={() => onMarkAsPaid(payment.id, selectedWeek.weekStart)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium"
              >
                Pagar
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-green-700 font-medium">Semana ya pagada</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}