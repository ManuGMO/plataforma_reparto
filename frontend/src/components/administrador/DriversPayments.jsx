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
      // Agrupar por repartidor: convertir array de semanas a estructura por driver
      const data = res.data || [];
      const map = new Map();
      data.forEach(item => {
        const id = item.id;
        if (!map.has(id)) {
          map.set(id, {
            id,
            driver: item.driver,
            email: item.email,
            weeks: []
          });
        }
        map.get(id).weeks.push(item);
      });

      // Crear arreglo final con totales agregados por repartidor
      const grouped = Array.from(map.values()).map(d => {
        // semanas no pagadas
        const pendingWeeks = d.weeks.filter(w => w.status !== 'paid');

        const totals = pendingWeeks.reduce((s, w) => {
          s.deliveries += Number(w.deliveries || 0);
          s.gross += Number(w.grossAmount || 0);
          s.retentions += Number(w.retentions || 0);
          s.net += Number(w.netAmount || 0);
          return s;
        }, { deliveries: 0, gross: 0, retentions: 0, net: 0 });

        // defaultWeek: preferir la semana no pagada más reciente; si no hay, la más reciente en general
        const defaultWeek = (pendingWeeks.slice().sort((a,b) => b.weekStart.localeCompare(a.weekStart))[0]) || d.weeks.slice().sort((a,b) => b.weekStart.localeCompare(a.weekStart))[0];

        return {
          ...d,
          totals,
          defaultWeek,
          pendingWeeks
        };
      });

      setPayments(grouped);
    } catch (err) {
      console.error('Error al cargar pagos repartidores', err);
      setNotification && setNotification('Error al cargar pagos de repartidores');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleMarkAsPaid = async (repartidorId, weekStart) => {
    try {
      const payload = weekStart ? { weekStart } : {};
      const res = await axios.post(`http://localhost:3001/api/admin/pagos-repartidores/${repartidorId}/marcar-pagado`, payload);
      setNotification && setNotification('Pago marcado como realizado y liquidación creada');
      // refrescar lista
      await fetchPayments();
      setSelectedPayment(null);
      return res.data;
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semana</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entregas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bruto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retenciones</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map(driver => (
              <tr key={driver.id} className="hover:bg-gray-50 text-gray-700">
                <td className="px-6 py-4 text-sm font-medium">{driver.driver}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{driver.defaultWeek ? driver.defaultWeek.period : '-'}</td>
                <td className="px-6 py-4 text-sm">{driver.totals.deliveries}</td>
                <td className="px-6 py-4 text-sm">${Math.round(driver.totals.gross)}</td>
                <td className="px-6 py-4 text-sm text-red-600">-${Math.round(driver.totals.retentions)}</td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">${Math.round(driver.totals.net)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    // Si todas sus semanas están pagadas, marcar pagado
                    driver.weeks.every(w => w.status === 'paid') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {driver.weeks.every(w => w.status === 'paid') ? 'Pagado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button
                    onClick={() => setSelectedPayment(driver)}
                    className="text-blue-600 hover:text-blue-900 mr-3 bg-transparent border border-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg"
                  >
                    Ver Detalle
                  </button>
                  {!driver.weeks.every(w => w.status === 'paid') && (
                    <button
                      onClick={() => handleMarkAsPaid(driver.id, driver.defaultWeek?.weekStart)}
                      className="text-green-600 hover:text-green-900 bg-transparent border border-green-600 hover:bg-green-50 px-3 py-1 rounded-lg"
                    >
                      Marcar Pagado (Semana)
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
          onMarkAsPaid={(id, weekStart) => handleMarkAsPaid(id, weekStart)}
        />
      )}
    </div>
  );
}