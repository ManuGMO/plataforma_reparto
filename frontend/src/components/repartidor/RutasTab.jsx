import { useState } from 'react';

export default function RutasTab({ repartidorId }) {
  const [routes, setRoutes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Por ahora mostraremos un placeholder básico
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Mis Rutas</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Agregar Ruta
        </button>
      </div>
      
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛣️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No tienes rutas configuradas</h3>
        <p className="text-gray-500 text-sm">Agrega tus rutas frecuentes para recibir pedidos optimizados</p>
      </div>
    </div>
  );
}