import { useState, useEffect } from "react";
import axios from "axios";

export default function CheckoutModal({ isOpen, onClose, carritoData, onConfirmOrder }) {
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("transfer");
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!direccion.trim()) {
      return;
    }

    setProcesando(true);
    try {
      await onConfirmOrder({ direccion, metodoPago });
      onClose();
      setDireccion("");
    } catch (error) {
      console.error("Error al confirmar pedido:", error);
    } finally {
      setProcesando(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md mt-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0">
          <div className="px-4 py-3 flex items-center">
            <button 
              onClick={onClose}
              className="mr-3 text-2xl hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ←
            </button>
            <h1 className="text-lg font-bold text-gray-900">Confirmar Pedido</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dirección de entrega */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Dirección de entrega</h3>
              <textarea 
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                rows="1" 
                placeholder="Ingresa tu dirección..." 
                required
              />
            </div>

            {/* Método de pago */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Método de pago</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 text-gray-600">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="transfer" 
                    checked={metodoPago === "transfer"}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>💳 Transferencia bancaria</span>
                </label>
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Resumen del pedido</h3>
              <div className="space-y-2 text-sm text-gray-700">
                {carritoData.items && carritoData.items.map((item, index) => (
                  <div key={index} className="flex justify-between ">
                    <span>{item.cantidad}x {item.nombre}</span>
                    <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">${carritoData.total || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={procesando || !direccion.trim()}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  procesando || !direccion.trim()
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {procesando ? 'Procesando...' : 'Confirmar y Pagar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}