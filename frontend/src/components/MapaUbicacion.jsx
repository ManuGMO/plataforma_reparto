// src/components/MapaUbicacion.jsx
import { useRef, useEffect, useState } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Usar el mismo token que en PaymentModal
mapboxgl.accessToken = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA';

export default function MapaUbicacion({ onUbicacionSeleccionada }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [cargandoGeolocalizacion, setCargando] = useState(false);

  // Inicializar mapa
  useEffect(() => {
    if (map.current) return; // prevenir dobles inicializaciones

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-70.6483, -33.4569], // Santiago por defecto
      zoom: 12,
    });

    // Esperar a que cargue el mapa
    map.current.on("load", () => {
      console.log("Mapa cargado ✅");
      obtenerUbicacionUsuario();
    });

    // Al hacer clic en el mapa → mover marcador
    map.current.on("click", (e) => {
      actualizarUbicacion(e.lngLat.lng, e.lngLat.lat);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Obtener ubicación del usuario
  const obtenerUbicacionUsuario = () => {
  if (!map.current) return;
  setCargando(true);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        actualizarUbicacion(longitude, latitude);
        map.current.flyTo({ center: [longitude, latitude], zoom: 15 });
        setCargando(false);
      },
      (err) => {
        console.error("Error al obtener ubicación:", err);
        // fallback a Santiago
        actualizarUbicacion(-70.6483, -33.4569);
        setCargando(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  } else {
    actualizarUbicacion(-70.6483, -33.4569);
    setCargando(false);
  }
};


  // Crear o mover marcador
  const actualizarUbicacion = (lng, lat) => {
    if (!map.current) return; // seguridad

    const nuevaUbicacion = { lng, lat };
    setUbicacionActual(nuevaUbicacion);

    if (onUbicacionSeleccionada) {
      onUbicacionSeleccionada(nuevaUbicacion);
    }

    // Si ya existe marcador → moverlo
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      // Crear nuevo marcador
      marker.current = new mapboxgl.Marker({ draggable: true, color: "#22c55e" })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Evento dragend para actualizar coordenadas
      marker.current.on("dragend", () => {
        const coords = marker.current.getLngLat();
        actualizarUbicacion(coords.lng, coords.lat);
      });
    }
  };

  // Función para centrar en ubicación actual
  const centrarEnUbicacion = () => {
    obtenerUbicacionUsuario();
  };

  return (
    <div className="relative">
      {/* Controles superiores */}
      <div className="absolute top-3 left-3 z-10 flex flex-col space-y-2">
        <button
          onClick={centrarEnUbicacion}
          disabled={cargandoGeolocalizacion}
          className="bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-lg shadow-md border border-gray-200 transition-all duration-200 disabled:opacity-50"
          title="Centrar en mi ubicación"
        >
          {cargandoGeolocalizacion ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-lg">📍</span>
          )}
        </button>
      </div>

      {/* Información de coordenadas */}
      {ubicacionActual && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">
                📍 Ubicación seleccionada
              </p>
              <p className="text-xs text-gray-600 font-mono">
                Lat: {ubicacionActual.lat.toFixed(5)}, Lng: {ubicacionActual.lng.toFixed(5)}
              </p>
            </div>
            <div className="text-2xl">
              ✓
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones si no hay ubicación */}
      {!ubicacionActual && !cargandoGeolocalizacion && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border border-gray-200 max-w-xs text-center">
          <p className="text-sm text-gray-700 mb-2">
            <span className="text-lg mb-2 block">🗺️</span>
            Haz clic en el mapa para seleccionar tu ubicación
          </p>
          <p className="text-xs text-gray-500">
            También puedes arrastrar el marcador una vez colocado
          </p>
        </div>
      )}

      {/* Contenedor del mapa */}
      <div 
        ref={mapContainer}
        className="w-full h-80 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md"
        style={{ height: '320px' }}
      />
    </div>
  );
}