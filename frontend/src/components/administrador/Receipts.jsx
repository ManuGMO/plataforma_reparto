import { useState, useEffect } from 'react';
import axios from 'axios';
import ReceiptDetailModal from './ReceiptDetailModal';

export default function Receipts({ setNotification }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/admin/comprobantes`, {
        params: { estado: statusFilter }
      });
      setReceipts(response.data);
    } catch (error) {
      console.error('Error al cargar comprobantes:', error);
      setNotification('Error al cargar comprobantes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (pedidoId) => {
    try {
      await axios.put(`http://localhost:3001/api/admin/comprobantes/${pedidoId}/validar`, {
        accion: 'aprobar'
      });
      setNotification('Comprobante aprobado correctamente');
      setSelectedReceipt(null);
      fetchReceipts();
    } catch (error) {
      console.error('Error al aprobar:', error);
      setNotification('Error al aprobar el comprobante');
    }
  };

  const handleReject = async (pedidoId) => {
    try {
      await axios.put(`http://localhost:3001/api/admin/comprobantes/${pedidoId}/validar`, {
        accion: 'rechazar'
      });
      setNotification('Comprobante rechazado');
      setSelectedReceipt(null);
      fetchReceipts();
    } catch (error) {
      console.error('Error al rechazar:', error);
      setNotification('Error al rechazar el comprobante');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Cargando comprobantes...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Comprobantes de Pago</h2>
        <p className="text-gray-600">Validar comprobantes enviados por clientes</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>
      
      {receipts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <span className="text-6xl">🧾</span>
          <p className="text-gray-600 mt-4">No hay comprobantes {statusFilter === 'pending' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {receipts.map(receipt => (
            <div
              key={receipt.id_pedido}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedReceipt(receipt)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedReceipt(receipt); }}
              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  !receipt.pago_confirmado && receipt.comprobante_pago ? 'bg-yellow-100 text-yellow-800' :
                  receipt.pago_confirmado ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {!receipt.pago_confirmado && receipt.comprobante_pago ? 'Pendiente' :
                   receipt.pago_confirmado ? 'Aprobado' : 'Sin comprobante'}
                </span>
                <span className="text-sm text-gray-500">Pedido #{receipt.id_pedido}</span>
              </div>
              
              {receipt.comprobante_pago ? (
                <img
                  src={`http://localhost:3001/${receipt.comprobante_pago}`}
                  alt="Comprobante"
                  className="w-full h-32 object-cover rounded border mb-3"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded border mb-3 flex items-center justify-center">
                  <span className="text-gray-400">Sin comprobante</span>
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium text-gray-500">{receipt.comprador_nombre || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-medium text-gray-500">${receipt.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium text-gray-500">
                    {new Date(receipt.fecha_creacion).toLocaleDateString('es-CL')}
                  </span>
                </div>
              </div>
              
              {!receipt.pago_confirmado && receipt.comprobante_pago && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedReceipt(receipt); }}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Validar Comprobante
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedReceipt && (
        <ReceiptDetailModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}