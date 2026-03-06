import { useEffect, useState } from 'react';
import axios from 'axios';

export default function WeeklyEarnings({ setNotification }) {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [detalle, setDetalle] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchWeeks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/admin/ganancias-semanales`);
      setWeeks(res.data || []);

      console.log('Ganancias semanales cargadas:', res.data);

    } catch (err) {
      console.error('Error cargando ganancias semanales', err);
      setNotification && setNotification('Error cargando ganancias semanales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWeeks(); }, []);

  const loadDetalle = async (weekStart) => {
    try {
      setDetalle([]);
      setSelectedWeek(weekStart);
      const res = await axios.get(`${API_URL}/api/admin/ganancias-semanales/${weekStart}/detalle`);
      setDetalle(res.data || []);
    } catch (err) {
      console.error('Error cargando detalle de semana', err);
      setNotification && setNotification('Error cargando detalle de semana');
      setDetalle([]);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ganancias Semanales</h2>
        <p className="text-gray-600">Resumen por semana con comisiones y pagos a repartidores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-3">Semanas</h3>
          {loading ? (
            <div className="text-sm text-gray-600">Cargando...</div>
          ) : weeks.length === 0 ? (
            <div className="text-sm text-gray-600">No hay datos</div>
          ) : (
            <ul className="space-y-3">
              {weeks.map(w => (
                <li key={w.weekStart} className="p-3 border rounded flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Semana: {w.period}</div>
                    <div className="text-xs text-gray-500">Pedidos: {w.deliveries}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900 font-medium">Total: ${w.totalTotal}</div>
                    <div className="text-sm text-gray-900">Bruto: ${w.totalBruto}</div>
                    <div className="text-xs text-gray-500">Pago a repartidores: ${w.totalPagoReparto}</div>
                    <div className="text-xs text-gray-500">Comisión comprador: ${w.totalComisionComprador ?? 0}</div>
                    <div className="text-xs text-gray-500">Comisión vendedor: ${w.totalComisionVendedor ?? 0}</div>
                    <div className="text-sm text-green-700 font-semibold">Comisiones (ganancia neta): ${w.totalComision >= 0 ? w.totalComision : w.platformEarnings}</div>
                    <div className="mt-2">
                      <button onClick={() => loadDetalle(w.weekStart)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Ver detalle</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-3">Detalle {selectedWeek || ''}</h3>
          {selectedWeek ? (
            detalle.length === 0 ? (
              <div className="text-sm text-gray-600">No hay pedidos para esta semana</div>
            ) : (
              <table className="w-full text-sm border border-gray-200 border-collapse">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-2 py-2 border-r border-gray-200">Pedido</th>
                    <th className="px-2 py-2 border-r border-gray-200">Fecha</th>
                    <th className="px-2 py-2 border-r border-gray-200">Bruto</th>
                    <th className="px-2 py-2 border-r border-gray-200">Comisión Plataforma</th>
                    <th className="px-2 py-2 border-r border-gray-200">Comisión Vendedor</th>
                    <th className="px-2 py-2 border-r border-gray-200">Pago Reparto</th>
                    <th className="px-2 py-2 border-r border-gray-200">Total</th>
                    <th className="px-2 py-2 border-r border-gray-200">Vendedor</th>
                    <th className="px-2 py-2">Comprador</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.map(d => (
                    <tr key={d.id_pedido} className="text-gray-500">
                      <td className="py-2 px-2 border-r border-gray-200">#{d.id_pedido}</td>
                      <td className="py-2 px-2 text-xs text-gray-500">{new Date(d.fecha_pedido).toLocaleDateString('es-CL').replace(/\//g, '-')}</td>
                      <td className="py-2 px-2 border-r border-gray-200">${d.precio_bruto}</td>
                      <td className="py-2 px-2 border-r border-gray-200">${d.comision_servicio}</td>
                      <td className="py-2 px-2 border-r border-gray-200">${d.comision_vendedor ?? 0}</td>
                      <td className="py-2 px-2 border-r border-gray-200">${d.pago_reparto}</td>
                      <td className="py-2 px-2 border-r border-gray-200">${d.total}</td>
                      <td className="py-2 px-2 border-r border-gray-200 text-xs">{d.vendedor?.nombre || '-'}</td>
                      <td className="py-2 px-2 text-xs">{d.comprador?.nombre || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <div className="text-sm text-gray-600">Selecciona una semana para ver detalles</div>
          )}
        </div>
      </div>
    </div>
  );
}
