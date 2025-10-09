import { useEffect, useState } from 'react';
import DriverPaymentDetailModal from './DriverPaymentDetailModal';
import axios from 'axios';


export default function DriversPayments({ setNotification }) {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const API = import.meta.env.VITE_API_URL || '';

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/admin/pagos-repartidores`);
      setPayments(res.data);
    } catch (err) {
      console.error('Error al cargar pagos repartidores', err);
      setNotification && setNotification('Error al cargar pagos de repartidores');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleMarkAsPaid = async (repartidorId) => {
    try {
      const res = await axios.post(`http://localhost:3001/api/admin/pagos-repartidores/${repartidorId}/marcar-pagado`);
      if (!res.ok) throw new Error('Error marcando como pagado');
      const json = await res.json();
      setNotification && setNotification('Pago marcado como realizado y liquidación creada');
      // refrescar lista
      await fetchPayments();
      setSelectedPayment(null);
      return json;
    } catch (err) {
      console.error(err);
      setNotification && setNotification('No se pudo marcar como pagado');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pagos a Repartidores</h2>
        <p className="text-gray-600">Gestionar liquidaciones y boletas de honorarios</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Repartidor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entregas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bruto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retenciones</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50 text-gray-700">
                <td className="px-6 py-4 text-sm font-medium">{payment.driver}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{payment.period}</td>
                <td className="px-6 py-4 text-sm">{payment.deliveries}</td>
                <td className="px-6 py-4 text-sm">${(payment.grossAmount || 0)}</td>
                <td className="px-6 py-4 text-sm text-red-600">-${(payment.retentions || 0)}</td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">${(payment.netAmount || 0 )}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button
                    onClick={() => setSelectedPayment(payment)}
                    className="text-blue-600 hover:text-blue-900 mr-3 bg-transparent border border-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg"
                  >
                    Ver Detalle
                  </button>
                  {payment.status !== 'paid' && (
                    <button
                      onClick={() => handleMarkAsPaid(payment.id)}
                      className="text-green-600 hover:text-green-900 bg-transparent border border-green-600 hover:bg-green-50 px-3 py-1 rounded-lg"
                    >
                      Marcar Pagado
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPayment && (
        <DriverPaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onMarkAsPaid={() => handleMarkAsPaid(selectedPayment.id)}
        />
      )}
    </div>
  );
}