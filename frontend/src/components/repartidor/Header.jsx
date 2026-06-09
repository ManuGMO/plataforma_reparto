import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Header() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { logout, user } = useAuth();
  const firstName = user?.nombre ? user.nombre.split(' ')[0] : null;

  return (
    <>
      <header className="bg-white shadow px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{firstName ? firstName.charAt(0).toUpperCase() : 'R'}</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{firstName || 'Repartidor'}</h2>
          </div>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="border border-red-600 text-sm text-red-600 bg-white  px-3 py-1 hover:bg-red-700 hover:text-white hover:border-red-700 transition-colors"
        >
          ➜]
        </button>
      </header>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 max-w-sm w-full">
            <p className="text-gray-800 mb-4">¿Deseas cerrar sesión?</p>
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-1 bg-gray-600 text-white rounded" onClick={() => setConfirmOpen(false)}>Cancelar</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => { setConfirmOpen(false); logout(); }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
