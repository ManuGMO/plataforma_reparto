import { useEffect, useState } from 'react';
import axios from 'axios';

const IVA_RATE = 0.145; // 14.5%
const API_URL = import.meta.env.VITE_API_URL;
function formatCurrency(n) {
  return `$${Number(n).toLocaleString('es-CL')}`;
}

export default function PerfilTab({ repartidorId }) {
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState([]); // semanas del repartidor
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    if (!repartidorId) return;
    setLoading(true);
    // Obtener resumen global y filtrar por repartidor
    axios.get(`${API_URL}/api/admin/pagos-repartidores`)
      .then(res => {
        const all = res.data || [];
        const mine = all.filter(r => Number(r.id) === Number(repartidorId));
        setResumen(mine);
      })
      .catch(err => {
        console.error('Error cargando resumen de pagos:', err);
      })
      .finally(() => setLoading(false));
  }, [repartidorId]);

  const loadDetalle = async (weekStart) => {
    if (!repartidorId || !weekStart) return;
    setLoadingDetalle(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/pagos-repartidores/${repartidorId}/detalle?weekStart=${weekStart}`);
      setDetalle(res.data || []);
      setSelectedWeek(weekStart);
    } catch (e) {
      console.error('Error cargando detalle de semana:', e);
      setDetalle([]);
      setSelectedWeek(null);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // IVA (retención) calculada sobre el bruto
  const computeIVA = (amount) => Math.round(amount * IVA_RATE);
  const computeNetFromGross = (gross) => Math.round(gross - computeIVA(gross));

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Mis Boletas Semanales</h2>
      </div>

      <div className="md:col-span-2 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Resumen de semanas</h3>
          {loading ? (
            <div className="text-sm text-gray-600">Cargando...</div>
          ) : resumen.length === 0 ? (
            <div className="text-sm text-gray-600">No hay boletas para este repartidor.</div>
          ) : (
            <ul className="space-y-2">
              {resumen.map(r => (
                <li key={r.weekStart} className="p-3 border rounded hover:shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Semana: <span className="text-xs text-gray-500">({r.period})</span></div>
                    <div className="text-xs text-gray-500">Entregas: {r.deliveries}</div>
                  </div>
                  <div className="text-right">
                    {/* Mostrar Neto calculado a partir del Bruto: Neto = Bruto - IVA */}
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(r.netAmount ?? computeNetFromGross(r.grossAmount))}</div>
                    <div className="text-xs text-gray-500 font-semibold">Bruto: {formatCurrency(r.grossAmount)}</div>
                    <div className="text-xs text-gray-500 font-semibold">IVA (14.5% sobre bruto): {formatCurrency(computeIVA(r.grossAmount))}</div>
                    <div className="text-sm text-gray-700 font-medium">Total bruto menos IVA (Neto calculado): {formatCurrency(computeNetFromGross(r.grossAmount))}</div>
                    <div className={`mt-2 text-xs font-medium ${r.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{r.status === 'paid' ? 'Pagada' : 'Pendiente'}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => loadDetalle(r.weekStart)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Ver detalle</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Detalle de la semana {selectedWeek || '-'} </h3>
          {loadingDetalle ? (
            <div className="text-sm text-gray-600">Cargando detalle...</div>
          ) : detalle.length === 0 ? (
            <div className="text-sm text-gray-600">Selecciona una semana para ver pedidos</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map(d => (
                  <tr key={d.id_pedido} className="border-t">
                    <td className="py-2">#{d.id_pedido}</td>
                    <td className="py-2 text-xs text-gray-500">{new Date(d.fecha_pedido).toLocaleString()}</td>
                    <td className="py-2">{formatCurrency(d.pago_reparto)}</td>
                    <td className="py-2 text-xs">{d.estado_pedido}</td>
                    <td className="py-2 text-xs text-gray-600">{d.direccion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}