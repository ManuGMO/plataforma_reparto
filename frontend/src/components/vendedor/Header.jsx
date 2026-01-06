import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Header({ onOpenProfile }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { logout, user } = useAuth();
  const firstName = user?.nombre ? user.nombre.split(' ')[0] : null;
  const [address, setAddress] = useState(null);

  const getAddressFromCoords = async (lat, lng) => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=es`
        );
        const data = await res.json();

        const direccion = data?.features?.[0]?.place_name?.split(',')[0] || null;

        return direccion; // la mejor coincidencia
      } catch (e) {
        return null;
      }
  };

  useEffect(() => {
    if (user.latitud && user.longitud) {
      (async () => {
        const place = await getAddressFromCoords(
          user?.latitud,
          user?.longitud
        );
        
        setAddress(place|| null);
      })();
    }
  }, [user?.direccion, user?.latitud, user?.longitud]);

  const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA';

  

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{firstName || 'Vendedor'}</h2>
              <p className="text-xs text-gray-500">📍 {address}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div onClick={() => onOpenProfile && onOpenProfile()} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-lg">👤</span>
              </div>
            <button
                onClick={() => setConfirmOpen(true)}
                className="border border-red-600 text-sm text-red-600 bg-white  px-3 py-1 hover:bg-red-700 hover:text-white hover:border-red-700 transition-colors"
              >
                ➜]
              </button>
          </div>
        </div>
      </header>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 max-w-sm w-full">
            <p className="text-gray-800 mb-4">¿Deseas cerrar sesión?</p>
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-1" onClick={() => setConfirmOpen(false)}>Cancelar</button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded"
                onClick={() => { setConfirmOpen(false); logout(); }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
