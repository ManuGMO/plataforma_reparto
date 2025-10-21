// --- Gestión de pagos a vendedores ---

import { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentDetailModal from './PaymentDetailModal';

export default function SellersPayments({ setNotification }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/admin/pagos-vendedores', {
        params: { estado: statusFilter }
      });
      setPayments(response.data);
      console.log('Pagos de vendedores cargados:', response.data);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setNotification('Error al cargar pagos de vendedores');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (vendedorId, weekStart = null) => {
    try {
      const url = `http://localhost:3001/api/admin/pagos-vendedores/${vendedorId}/marcar-pagado`;
      let response;
      if (weekStart) {
        response = await axios.post(url, { weekStart });
      } else {
        response = await axios.put(url);
      }
      setNotification('Pagos marcados como realizados');
      setSelectedPayment(null);
      fetchPayments();
      return response?.data;
    } catch (error) {
      console.error('Error al marcar como pagado:', error);
      setNotification('Error al procesar el pago');
      throw error;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Cargando pagos...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pagos a Vendedores</h2>
        <p className="text-gray-600">Gestionar cobros y liquidaciones de vendedores</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-900"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagado">Pagados</option>
          </select>
        </div>
      </div>
     
      {payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <span className="text-6xl">💰</span>
          <p className="text-gray-600 mt-4">No hay pagos registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Bruto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comisiones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IVA Comisión</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">A Pagar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendientes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map(payment => (
                  <tr key={payment.id_vendedor} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.nombre_vendedor}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{payment.email_vendedor}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{payment.total_pedidos}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(payment.total_precio_bruto)}</td>
                    <td className="px-6 py-4 text-sm text-red-600">-{formatCurrency(payment.total_comisiones)}</td>
                    <td className="px-6 py-4 text-sm text-orange-600">{formatCurrency(payment.iva_comision)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(payment.monto_a_pagar)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.pedidos_pendientes > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {payment.pedidos_pendientes} pedidos
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900 bg-transparent border border-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg"
                      >
                        Ver Detalle
                      </button>
                      {payment.pedidos_pendientes > 0 && (
                        <button
                          onClick={() => handleMarkAsPaid(payment.id_vendedor)}
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
        </div>
      )}

      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onMarkAsPaid={handleMarkAsPaid}
        />
      )}
    </div>
  );
}