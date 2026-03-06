import { useState, useEffect, useRef } from 'react';

export default function LocationModal({ initial, onClose, onSave }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [marker, setMarker] = useState(initial || null);
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    const ensureCss = () => {
      if (typeof document === 'undefined') return;
      if (!document.querySelector('link[data-mapbox-gl]')) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css');
        link.setAttribute('data-mapbox-gl', '1');
        document.head.appendChild(link);
      }
    };
    ensureCss();

    let mounted = true;
    (async () => {
      try {
        const mb = await import('mapbox-gl');
        mb.accessToken = MAPBOX_TOKEN;
        if (!containerRef.current) return;
        mapRef.current = new mb.Map({ container: containerRef.current, style: 'mapbox://styles/mapbox/streets-v11', center: marker ? [marker.lng, marker.lat] : [-70.6506, -33.4372], zoom: marker ? 13 : 5 });
        mapRef.current.addControl(new mb.NavigationControl());
        mapRef.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          setMarker({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        });
      } catch (err) { console.error('map init error', err); }
    })();

    return () => { mounted = false; if (mapRef.current) mapRef.current.remove(); };
  }, []);

  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log('Error getting location for proximity', err)
      );
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query) return setResults([]);
      try {
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=es`;
        if (currentLocation) {
          url += `&proximity=${currentLocation.lng},${currentLocation.lat}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.features || []);
      } catch (e) { setResults([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [query, currentLocation]);

  useEffect(() => {
    (async () => {
      try {
        const mb = await import('mapbox-gl');
        if (!mapRef.current) return;
        if (mapRef.current._customMarker) { mapRef.current._customMarker.remove(); mapRef.current._customMarker = null; }
        if (marker) {
          const el = document.createElement('div');
          el.className = 'w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow';
          mapRef.current._customMarker = new mb.Marker(el).setLngLat([marker.lng, marker.lat]).addTo(mapRef.current);
          mapRef.current.flyTo({ center: [marker.lng, marker.lat], zoom: 14 });
        }
      } catch (err) { }
    })();
  }, [marker]);

  const chooseResult = (f) => {
    setMarker({ lat: f.center[1], lng: f.center[0] });
    setResults([]);
    setQuery(f.place_name);
  };

  const useCurrent = () => {
    if (!navigator.geolocation) return alert('Geolocalización no disponible');
    navigator.geolocation.getCurrentPosition((pos) => {
      setMarker({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, (err) => alert('No se pudo obtener ubicación: ' + err.message));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-4 max-w-3xl w-full mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold ">Seleccionar ubicación</h3>
          <button onClick={onClose} className="px-3 py-1 text-white rounded bg-red-500 hover:bg-red-700">Cerrar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className=" bg-gray-200 w-full border rounded p-2 mb-2 hover:bg-gray-300 placeholder-black focus:outline-none focus:border-gray-700" placeholder="Buscar dirección..." />
            <div className="space-y-2 max-h-60 overflow-auto">
              {results.map((r) => (
                <button key={r.id} onClick={() => chooseResult(r)} className="text-black w-full text-left px-2 py-2 hover:bg-gray-50">{r.place_name}</button>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={useCurrent} className="w-full bg-green-500 hover:bg-green-700 hover:border-green-700 px-3 py-2 text-white rounded">Usar ubicación actual</button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div ref={containerRef} className="w-full h-80 rounded border overflow-hidden" />
            <div className="mt-2 text-xs text-gray-600">Haz click en el mapa para mover el marcador, o busca arriba.</div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => onSave && marker && onSave(marker)} disabled={!marker} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
