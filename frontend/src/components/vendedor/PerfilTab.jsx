import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import axios from 'axios';
import LocationModal from '../common/LocationModal.jsx';

const API_URL = import.meta.env.VITE_API_URL;

export default function PerfilTab({ onSaved, onBack, forceOpenModal }) {
  const { user, updateUser } = useAuth();
  const userId = user?.id || user?.id_usuario;
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const miniContainerRef = useRef(null);
  const miniMapRef = useRef(null);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    const fetch = async () => {
      try {
        if (!userId) return setLoading(false);
        const res = await axios.get(`${API_URL}/api/usuarios/${userId}`);
        if (res.data && res.data.usuario) {
          const u = res.data.usuario;
          if (u.latitud != null && u.longitud != null) setLocation({ lat: Number(u.latitud), lng: Number(u.longitud) });
        }
      } catch (err) {
        console.warn('Error fetching user location', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  useEffect(() => {
    if (forceOpenModal) setModalOpen(true);
  }, [forceOpenModal]);

  useEffect(() => {
    if (!location || !miniContainerRef.current) return;
    let mounted = true;
    (async () => {
      try {
        const mb = await import('mapbox-gl');
        mb.accessToken = MAPBOX_TOKEN;
        if (!miniMapRef.current) {
          miniMapRef.current = new mb.Map({ container: miniContainerRef.current, style: 'mapbox://styles/mapbox/streets-v11', center: [location.lng, location.lat], zoom: 13, interactive: false });
        }
        // remove existing marker
        if (miniMapRef.current._miniMarker) { miniMapRef.current._miniMarker.remove(); miniMapRef.current._miniMarker = null; }
        const el = document.createElement('div');
        el.className = 'w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow';
        miniMapRef.current._miniMarker = new mb.Marker(el).setLngLat([location.lng, location.lat]).addTo(miniMapRef.current);
        miniMapRef.current.setCenter([location.lng, location.lat]);
      } catch (err) {
        console.warn('mini map init error', err);
      }
    })();
    return () => { if (miniMapRef.current) { miniMapRef.current.remove(); miniMapRef.current = null; } };
  }, [location]);

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => onBack && onBack()} className="px-3 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 hover:border-gray-600">← Volver</button>
        <h2 className="text-xl font-bold">Perfil</h2>
      </div>

      {loading ? (
        <p>Cargando Mapa ...</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">Tu ubicación actual registrada:</p>
          <div className="mb-4">
            {location ? (
              <div className="h-56 rounded overflow-hidden border">
                <div ref={miniContainerRef} className="w-full h-full" />
                <div className="p-2 text-xs text-gray-600">Lat: {location.lat}, Lng: {location.lng}</div>
              </div>
            ) : (
              <div className="h-56 rounded border flex items-center justify-center text-gray-500">No tienes ubicación registrada</div>
            )}
          </div>

          <div className="flex space-x-2">
            <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">Editar ubicación</button>
            <button onClick={() => { setLocation(null); updateUser({ latitud: null, longitud: null }); setNotification && setNotification('Ubicación eliminada'); }} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-700 hover:border-red-700">Eliminar</button>
          </div>

          {modalOpen && (
            <LocationModal
              initial={location}
              onClose={() => setModalOpen(false)}
              onSave={async (loc) => {
                try {
                  await axios.put(`${API_URL}/api/usuarios/${userId}/ubicacion`, { latitud: loc.lat, longitud: loc.lng });
                  updateUser({ latitud: loc.lat, longitud: loc.lng });
                  setLocation({ lat: loc.lat, lng: loc.lng });
                  if (onSaved) onSaved(loc);
                  setModalOpen(false);
                } catch (err) {
                  console.error('Error saving location', err);
                  alert('Error al guardar ubicación');
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
