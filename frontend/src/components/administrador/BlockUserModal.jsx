import { useState } from 'react';

export default function BlockUserModal({ user, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(user.id_usuario, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold text-gray-900">Bloquear Usuario</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario a bloquear</label>
            <p className="text-gray-900 font-medium">{user.nombre}</p>
            <p className="text-sm text-gray-600">{user.correo}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo: </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="Detalles adicionales..."
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
            >
              Bloquear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}