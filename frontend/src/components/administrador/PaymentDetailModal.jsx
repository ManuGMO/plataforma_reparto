// --- Detalles del pago para un vendedor específico ---

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PaymentDetailModal({ payment, onClose, onMarkAsPaid }) {
  const [detallePedidos, setDetallePedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    if (payment?.id_vendedor) fetchAllPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.id_vendedor]);

  const formatISO = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const fetchAllPedidos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/admin/pagos-vendedores/${payment.id_vendedor}/detalle`);
      const pedidos = response.data || [];

      // Agrupar por semana (Lunes-Domingo)
      const weeksMap = new Map();
      pedidos.forEach(p => {
        const fecha = new Date(p.fecha_pedido);
        const day = fecha.getDay(); // 0..6
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(fecha);
        monday.setDate(fecha.getDate() - diffToMonday);
        monday.setHours(0,0,0,0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);

        const key = formatISO(monday);
        if (!weeksMap.has(key)) weeksMap.set(key, { monday, sunday, pedidos: [] });
        weeksMap.get(key).pedidos.push(p);
      });

      const weeksArr = Array.from(weeksMap.entries()).map(([weekStart, { monday, sunday, pedidos }]) => {
        const bruto = pedidos.reduce((s, it) => s + Number(it.precio_bruto || 0), 0);
        const comision = pedidos.reduce((s, it) => s + Number(it.comision_servicio || 0), 0);
        const comisionVendedor = pedidos.reduce((s, it) => s + Number(it.comision_vendedor || 0), 0);
        const ivaComision = comision - (comision / 1.19);
        // Mantener compatibilidad: neto calculado originalmente resta la comisión plataforma
        const neto = bruto - comision;

        return {
          weekStart: weekStart,
          weekEnd: formatISO(sunday),
          periodLabel: `(${String(monday.getDate()).padStart(2,'0')} / ${String(monday.getMonth()+1).padStart(2,'0')}) - (${String(sunday.getDate()).padStart(2,'0')} / ${String(sunday.getMonth()+1).padStart(2,'0')})`,
          pedidos,
          bruto: Math.round(bruto),
          comision: Math.round(comision),
          comisionVendedor: Math.round(comisionVendedor),
          ivaComision: Math.round(ivaComision),
          neto: Math.round(neto)
        };
      }).sort((a,b) => (a.weekStart < b.weekStart ? 1 : -1));

      setWeeks(weeksArr);
      // seleccionar la semana más reciente por defecto
      if (weeksArr.length > 0) setSelectedWeek(weeksArr[0].weekStart);
      setDetallePedidos(pedidos);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekObj = weeks.find(w => w.weekStart === selectedWeek) || null;
    const [paying, setPaying] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">Detalle de Pagos - {payment.nombre_vendedor}</h3>
          <p className="text-sm text-gray-600">{payment.email_vendedor}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Seleccionar semana</h4>
              <select className="border rounded px-3 py-2 mt-2 bg-gray-50 text-gray-900" value={selectedWeek || ''} onChange={(e) => setSelectedWeek(e.target.value)}>
                {weeks.map(w => (
                  <option key={w.weekStart} value={w.weekStart}>{w.periodLabel}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500">Total semanas: {weeks.length}</div>
          </div>

          <div>
            {weekObj ? (
              <div className="bg-white shadow-sm border rounded-lg p-4 max-w-md">
                <div className="mb-2">
                  <div className="text-sm text-gray-500">{weekObj.periodLabel}</div>
                  <div className="text-xs text-gray-400">Pedidos: {weekObj.pedidos.length}</div>
                </div>
                <ul className="divide-y divide-gray-100">
                  <li className="py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-700">Precio bruto</span>
                    <strong className="text-sm text-gray-900">{formatCurrency(weekObj.bruto)}</strong>
                  </li>
                  <li className="py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-700">Comisión plataforma</span>
                    <span className="text-sm text-red-600">{formatCurrency(weekObj.comision)}</span>
                  </li>
                  {weekObj.comisionVendedor > 0 && (
                    <li className="py-3 flex justify-between items-center">
                      <span className="text-sm text-gray-700">Comisión vendedor</span>
                      <span className="text-sm text-red-600">-{formatCurrency(weekObj.comisionVendedor)}</span>
                    </li>
                  )}
                  <li className="py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-700">IVA sobre comisiones</span>
                    <span className="text-sm text-orange-600">{formatCurrency(weekObj.ivaComision)}</span>
                  </li>
                  <li className="pt-4 pb-2 flex justify-between items-center">
                    <span className="text-base font-medium text-gray-800">Total a pagar</span>
                    <span className="text-xl font-bold text-green-700">{formatCurrency(weekObj.neto)}</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg max-w-md">
                <p className="text-sm text-gray-400">No hay datos</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Historial de Pedidos</h4>
            {loading ? (
              <p className="text-center text-gray-500 py-4">Cargando...</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {weekObj ? (
                  weekObj.pedidos.map(pedido => (
                    <div key={pedido.id_pedido} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">Pedido #{pedido.id_pedido}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${pedido.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {pedido.estado_pago}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{new Date(pedido.fecha_pedido).toLocaleDateString('es-CL')} - {pedido.direccion || 'Sin dirección'}</p>
                        <p className="text-xs text-gray-600">Estado: {pedido.estado_pedido}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-900">Bruto: {formatCurrency(pedido.precio_bruto)}</p>
                        <p className="text-xs text-red-600">Comisión: -{formatCurrency(pedido.comision_servicio)}</p>
                        <p className="text-xs font-medium text-green-600">A pagar: {formatCurrency(pedido.monto_vendedor)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No hay pedidos para esta semana</p>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-6 border-t">
            <button onClick={onClose} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300">Cerrar</button>
            {weekObj && weekObj.pedidos.some(p => p.estado_pago === 'pendiente') && (
              <button
                onClick={async () => {
                  try {
                    setPaying(true);
                    const data = await onMarkAsPaid(payment.id_vendedor, selectedWeek);
                    // aplicar cambios localmente usando ids_actualizados si vienen
                    if (data?.ids_actualizados && Array.isArray(data.ids_actualizados)) {
                      const updatedIds = new Set(data.ids_actualizados);
                      const newWeeks = weeks.map(w => {
                        if (w.weekStart !== selectedWeek) return w;
                        return {
                          ...w,
                          pedidos: w.pedidos.map(p => updatedIds.has(p.id_pedido) ? { ...p, estado_pago: 'pagado' } : p)
                        };
                      });
                      setWeeks(newWeeks);
                    }
                    setPaying(false);
                    onClose();
                  } catch (e) {
                    setPaying(false);
                  }
                }}
                className={`flex-1 ${paying ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white py-2 rounded-lg font-medium`}
                disabled={paying}
              >
                {paying ? 'Procesando...' : `Marcar ${weekObj.pedidos.filter(p => p.estado_pago === 'pendiente').length} Pedidos como Pagados`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}