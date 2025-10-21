import { useEffect, useRef } from 'react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA';

export default function RutaPreviewModal({ isOpen, onClose, ruta }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!isOpen || !ruta || typeof window === 'undefined') return;
      try {
        const mapboxgl = await import('mapbox-gl');
        mapboxgl.accessToken = MAPBOX_TOKEN;
        if (!mounted) return;
        // crear mapa si no existe
        if (!mapRef.current) {
          mapRef.current = new mapboxgl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [Number(ruta.origen_lng || ruta.origenLng), Number(ruta.origen_lat || ruta.origenLat)],
            zoom: 12
          });
          mapRef.current.addControl(new mapboxgl.NavigationControl());
          mapRef.current.on('load', () => {
            drawRoute();
          });
        } else {
          drawRoute();
        }

        async function drawRoute() {
          try {
            const from = `${Number(ruta.origen_lng)},${Number(ruta.origen_lat)}`;
            const to = `${Number(ruta.destino_lng)},${Number(ruta.destino_lat)}`;
            const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${from};${to}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);
            const data = await res.json();
            const route = data.routes && data.routes[0] && data.routes[0].geometry;
            if (!route || !mapRef.current) return;
            // limpiar fuente/layes previas
            try {
              if (mapRef.current.getLayer('ruta-preview')) mapRef.current.removeLayer('ruta-preview');
              if (mapRef.current.getSource('ruta-preview')) mapRef.current.removeSource('ruta-preview');
            } catch (e) {}
            mapRef.current.addSource('ruta-preview', { type: 'geojson', data: { type: 'Feature', geometry: route } });
            mapRef.current.addLayer({ id: 'ruta-preview', type: 'line', source: 'ruta-preview', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 5 } });
            // markers
            const mb = mapRef.current;
            const origenMarker = new (await import('mapbox-gl')).Marker({ color: '#16a34a' }).setLngLat([Number(ruta.origen_lng), Number(ruta.origen_lat)]).addTo(mb);
            const destinoMarker = new (await import('mapbox-gl')).Marker({ color: '#ef4444' }).setLngLat([Number(ruta.destino_lng), Number(ruta.destino_lat)]).addTo(mb);
            const coords = route.coordinates;
            const bounds = coords.reduce((b, c) => b.extend(c), new (await import('mapbox-gl')).LngLatBounds(coords[0], coords[0]));
            mb.fitBounds(bounds, { padding: 40 });
          } catch (e) {
            console.warn('Error dibujando ruta preview', e);
          }
        }
      } catch (e) {
        console.warn('Mapa preview no disponible', e);
      }
    };
    init();
    return () => {
      mounted = false;
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (e) {}
    };
  }, [isOpen, ruta]);

  if (!isOpen || !ruta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="font-semibold text-lg">{ruta.nombre_ruta || 'Ruta'}</h3>
            <div className="text-sm text-gray-500">{ruta.origen} → {ruta.destino}</div>
          </div>
          <button onClick={onClose} className="text-gray-600 px-2 py-1">✕</button>
        </div>
        <div className="w-full h-64" ref={containerRef} />
        <div className="p-4 border-t">
          <div className="text-sm text-gray-700"><strong>Día:</strong> {ruta.dia}</div>
          <div className="text-sm text-gray-700"><strong>Horario:</strong> {ruta.hora_inicio?.substring(0,5)} - {ruta.hora_fin?.substring(0,5)}</div>
        </div>
      </div>
    </div>
  );
}
