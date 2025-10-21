import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA';

export default function AgregarRutaModal({ isOpen, onClose, onGuardar, rutaEditar }) {
  const [formData, setFormData] = useState({
    nombre_ruta: '',
    origen: '',
    destino: '',
    hora_inicio: '',
    hora_fin: '',
    dia: 'lunes'
  });
  
  const [coordenadas, setCoordenadas] = useState({
    origen: null,
    destino: null
  });
  
  const [sugerenciasOrigen, setSugerenciasOrigen] = useState([]);
  const [sugerenciasDestino, setSugerenciasDestino] = useState([]);
  const [mostrarSugerenciasOrigen, setMostrarSugerenciasOrigen] = useState(false);
  const [mostrarSugerenciasDestino, setMostrarSugerenciasDestino] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [rutaGeojson, setRutaGeojson] = useState(null);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerOrigen = useRef(null);
  const markerDestino = useRef(null);
  const markerCurrent = useRef(null);
  const coordenadasRef = useRef(coordenadas);

  useEffect(() => {
    coordenadasRef.current = coordenadas;
  }, [coordenadas]);

  // Cargar datos si es edición
  useEffect(() => {
    if (rutaEditar) {
      setFormData({
        nombre_ruta: rutaEditar.nombre_ruta || '',
        origen: rutaEditar.origen,
        destino: rutaEditar.destino,
        hora_inicio: rutaEditar.hora_inicio,
        hora_fin: rutaEditar.hora_fin,
        dia: rutaEditar.dia
      });
      
      setCoordenadas({
        origen: { 
          lat: parseFloat(rutaEditar.origen_lat), 
          lng: parseFloat(rutaEditar.origen_lng) 
        },
        destino: { 
          lat: parseFloat(rutaEditar.destino_lat), 
          lng: parseFloat(rutaEditar.destino_lng) 
        }
      });
    }
  }, [rutaEditar]);

  // Inicializar mapa
  useEffect(() => {
    if (isOpen && mapContainer.current && !map.current) {
      setTimeout(() => {
        try {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-70.6693, -33.4489],
            zoom: 12
          });

          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

          map.current.on('load', () => {
            console.log('Mapa de rutas cargado');
            
            // Añadir capa para la línea de ruta
            map.current.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: []
                }
              }
            });

            map.current.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3b82f6',
                'line-width': 5,
                'line-opacity': 0.8
              }
            });

            // Si hay coordenadas de edición, mostrarlas
            if (coordenadas.origen && coordenadas.destino) {
              actualizarMarcador(coordenadas.origen.lng, coordenadas.origen.lat, 'origen');
              actualizarMarcador(coordenadas.destino.lng, coordenadas.destino.lat, 'destino');
            }

            // Intentar centrar en la ubicación actual del repartidor
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const lat = pos.coords.latitude;
                  const lng = pos.coords.longitude;
                  try {
                    map.current.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });

                    // marcador de ubicación actual
                    if (markerCurrent.current) markerCurrent.current.remove();
                    markerCurrent.current = new mapboxgl.Marker({ color: '#2563eb' })
                      .setLngLat([lng, lat])
                      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('📍 Tu ubicación'))
                      .addTo(map.current);
                  } catch (err) {
                    // no bloquear si falla
                    console.debug('No se pudo centrar en ubicación actual:', err);
                  }
                },
                (err) => {
                  console.debug('Geolocation falló o fue denegada:', err && err.message);
                },
                { enableHighAccuracy: true, timeout: 5000 }
              );
            }

            // Manejar clicks en el mapa para colocar origen/destino
            map.current.on('click', onMapClick);
          });
        } catch (error) {
          console.error('Error inicializando mapa:', error);
        }
      }, 200);
    }

    return () => {
      if (!isOpen && map.current) {
        try {
          map.current.off('click', onMapClick);
          map.current.remove();
        } catch (error) {
          console.error('Error limpiando mapa:', error);
        }
        map.current = null;
        markerOrigen.current = null;
        markerDestino.current = null;
        if (markerCurrent.current) { markerCurrent.current = null; }
      }
    };
  }, [isOpen]);

  // Buscar direcciones (Geocoding)
  const buscarDirecciones = async (query, tipo) => {
    if (query.length < 3) {
      if (tipo === 'origen') setSugerenciasOrigen([]);
      else setSugerenciasDestino([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxgl.accessToken}&` +
        `country=CL&` +
        `language=es&` +
        `limit=5`
      );
      
      const data = await response.json();
      const features = data.features || [];
      
      if (tipo === 'origen') {
        setSugerenciasOrigen(features);
        setMostrarSugerenciasOrigen(features.length > 0);
      } else {
        setSugerenciasDestino(features);
        setMostrarSugerenciasDestino(features.length > 0);
      }
    } catch (error) {
      console.error('Error buscando direcciones:', error);
    }
  };

  // Formatear dirección para mostrar
  const formatearDireccion = (placeName) => {
    const partes = placeName.split(', ');
    return partes.slice(0, 2).join(', ');
  };

  // Seleccionar sugerencia
  const seleccionarSugerencia = (sugerencia, tipo) => {
    const direccionFormateada = formatearDireccion(sugerencia.place_name);
    const [lng, lat] = sugerencia.center;
    
    if (tipo === 'origen') {
      setFormData(prev => ({ ...prev, origen: direccionFormateada }));
      setCoordenadas(prev => ({ ...prev, origen: { lng, lat } }));
      setSugerenciasOrigen([]);
      setMostrarSugerenciasOrigen(false);
      actualizarMarcador(lng, lat, 'origen');
    } else {
      setFormData(prev => ({ ...prev, destino: direccionFormateada }));
      setCoordenadas(prev => ({ ...prev, destino: { lng, lat } }));
      setSugerenciasDestino([]);
      setMostrarSugerenciasDestino(false);
      actualizarMarcador(lng, lat, 'destino');
    }
  };

  // Actualizar marcadores en el mapa
  const actualizarMarcador = (lng, lat, tipo) => {
    if (!map.current || !map.current.loaded()) {
      setTimeout(() => actualizarMarcador(lng, lat, tipo), 200);
      return;
    }

    try {
      if (tipo === 'origen') {
        // remover listener previo si existe
        if (markerOrigen.current) {
          try {
            const elPrev = markerOrigen.current.getElement();
            if (elPrev && markerOrigen.current._clickHandler) elPrev.removeEventListener('click', markerOrigen.current._clickHandler);
          } catch (e) { /* noop */ }
          markerOrigen.current.remove();
        }
        markerOrigen.current = new mapboxgl.Marker({ 
          color: '#22c55e',
          scale: 1.2
        })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('🟢 Origen'))
          .addTo(map.current);

        // agregar listener para borrar al click sobre el marcador
        try {
          const el = markerOrigen.current.getElement();
          el.style.cursor = 'pointer';
          const handler = (ev) => { ev.stopPropagation(); setCoordenadas(prev => ({ ...prev, origen: null })); setFormData(prev => ({ ...prev, origen: '' })); if (markerOrigen.current) { markerOrigen.current.remove(); markerOrigen.current = null; } };
          markerOrigen.current._clickHandler = handler;
          el.addEventListener('click', handler);
        } catch (err) { /* noop */ }
      } else {
        if (markerDestino.current) {
          try {
            const elPrev = markerDestino.current.getElement();
            if (elPrev && markerDestino.current._clickHandler) elPrev.removeEventListener('click', markerDestino.current._clickHandler);
          } catch (e) { /* noop */ }
          markerDestino.current.remove();
        }
        markerDestino.current = new mapboxgl.Marker({ 
          color: '#ef4444',
          scale: 1.2
        })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('🔴 Destino'))
          .addTo(map.current);

        try {
          const el = markerDestino.current.getElement();
          el.style.cursor = 'pointer';
          const handler2 = (ev) => { ev.stopPropagation(); setCoordenadas(prev => ({ ...prev, destino: null })); setFormData(prev => ({ ...prev, destino: '' })); if (markerDestino.current) { markerDestino.current.remove(); markerDestino.current = null; } };
          markerDestino.current._clickHandler = handler2;
          el.addEventListener('click', handler2);
        } catch (err) { /* noop */ }
      }

      // Calcular bounds teniendo en cuenta la coordenada recién pasada (porque setState es async)
      const tempOrigen = tipo === 'origen' ? { lng, lat } : coordenadas.origen;
      const tempDestino = tipo === 'destino' ? { lng, lat } : coordenadas.destino;

      if (tempOrigen && tempDestino) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([tempOrigen.lng, tempOrigen.lat]);
        bounds.extend([tempDestino.lng, tempDestino.lat]);
        map.current.fitBounds(bounds, { padding: 100, duration: 1000 });
        // Dibujar línea de ruta
        dibujarRuta();
      } else if (tipo === 'origen') {
        map.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
      } else if (tipo === 'destino') {
        map.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
      }
    } catch (error) {
      console.error('Error actualizando marcador:', error);
    }
  };

  // Distancia en metros entre dos coordenadas (haversine)
  const distanciaMetros = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // metros
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Reverse geocoding simple para mostrar dirección legible
  const reverseGeocode = async (lng, lat) => {
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=es&limit=1`);
      const data = await res.json();
      if (data && data.features && data.features[0]) return data.features[0].place_name;
    } catch (err) {
      console.debug('Reverse geocode falló:', err);
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  // Handler de clicks en el mapa para colocar/quitar marcadores
  const onMapClick = async (e) => {
    try {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
  console.debug('[AgregarRutaModal] onMapClick', { lng, lat, coordenadas: coordenadasRef.current });

      // Umbral para considerar "mismo punto" en metros
      const UMBRAL = 20; // metros

      // Si clic near origen -> eliminar origen
      if (coordenadasRef.current && coordenadasRef.current.origen) {
        const d = distanciaMetros(lat, lng, coordenadasRef.current.origen.lat, coordenadasRef.current.origen.lng);
        if (d <= UMBRAL) {
          setCoordenadas(prev => ({ ...prev, origen: null }));
          setFormData(prev => ({ ...prev, origen: '' }));
          if (markerOrigen.current) { markerOrigen.current.remove(); markerOrigen.current = null; }
          return;
        }
      }

      // Si clic near destino -> eliminar destino
      if (coordenadasRef.current && coordenadasRef.current.destino) {
        const d2 = distanciaMetros(lat, lng, coordenadasRef.current.destino.lat, coordenadasRef.current.destino.lng);
        if (d2 <= UMBRAL) {
          setCoordenadas(prev => ({ ...prev, destino: null }));
          setFormData(prev => ({ ...prev, destino: '' }));
          if (markerDestino.current) { markerDestino.current.remove(); markerDestino.current = null; }
          return;
        }
      }

      // Si no hay origen -> crear origen
      if (!coordenadasRef.current || !coordenadasRef.current.origen) {
        try {
          const place = await reverseGeocode(lng, lat);
          console.debug('[AgregarRutaModal] crear origen en', { lng, lat, place });
          setFormData(prev => ({ ...prev, origen: place }));
          setCoordenadas(prev => ({ ...prev, origen: { lng, lat } }));
          actualizarMarcador(lng, lat, 'origen');
        } catch (err) {
          console.error('Error creando origen:', err);
        }
        return;
      }

      // Si hay origen pero no destino -> crear destino
      if (coordenadasRef.current && coordenadasRef.current.origen && !coordenadasRef.current.destino) {
        try {
          const place = await reverseGeocode(lng, lat);
          console.debug('[AgregarRutaModal] crear destino en', { lng, lat, place });
          setFormData(prev => ({ ...prev, destino: place }));
          setCoordenadas(prev => ({ ...prev, destino: { lng, lat } }));
          actualizarMarcador(lng, lat, 'destino');
        } catch (err) {
          console.error('Error creando destino:', err);
        }
        return;
      }

      // Si ya había ambos, reiniciar origen (nuevo origen) y limpiar destino
      if (coordenadasRef.current && coordenadasRef.current.origen && coordenadasRef.current.destino) {
        const place = await reverseGeocode(lng, lat);
        setFormData(prev => ({ ...prev, origen: place, destino: '' }));
        setCoordenadas({ origen: { lng, lat }, destino: null });
        // remover marcadores previos y añadir nuevo origen
        if (markerOrigen.current) { markerOrigen.current.remove(); markerOrigen.current = null; }
        if (markerDestino.current) { markerDestino.current.remove(); markerDestino.current = null; }
        actualizarMarcador(lng, lat, 'origen');
        return;
      }
    } catch (err) {
      console.error('Error manejando click en mapa:', err);
    }
  };

  // Dibujar ruta entre origen y destino
  const dibujarRuta = async () => {
    if (!coordenadas.origen || !coordenadas.destino || !map.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${coordenadas.origen.lng},${coordenadas.origen.lat};` +
        `${coordenadas.destino.lng},${coordenadas.destino.lat}?` +
        `geometries=geojson&` +
        `steps=true&` +
        `access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0].geometry;
        
        // Guardar GeoJSON para la base de datos
        setRutaGeojson(JSON.stringify(route));
        
        // Actualizar el mapa
        map.current.getSource('route').setData({
          type: 'Feature',
          properties: {},
          geometry: route
        });
      }
    } catch (error) {
      console.error('Error dibujando ruta:', error);
    }
  };

  // Actualizar ruta cuando cambien las coordenadas
  useEffect(() => {
    if (coordenadas.origen && coordenadas.destino && map.current && map.current.loaded()) {
      dibujarRuta();
    }
  }, [coordenadas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.origen || !formData.destino || !formData.hora_inicio || !formData.hora_fin || !formData.dia) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (!coordenadas.origen || !coordenadas.destino) {
      alert('Por favor selecciona las ubicaciones exactas en el mapa');
      return;
    }

    if (formData.hora_fin <= formData.hora_inicio) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setGuardando(true);
    
    try {
      const datosRuta = {
        nombre_ruta: formData.nombre_ruta || `${formData.origen} → ${formData.destino}`,
        origen: formData.origen,
        origen_lat: coordenadas.origen.lat,
        origen_lng: coordenadas.origen.lng,
        destino: formData.destino,
        destino_lat: coordenadas.destino.lat,
        destino_lng: coordenadas.destino.lng,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        dia: formData.dia,
        ruta_geojson: rutaGeojson
      };

      await onGuardar(datosRuta);
      
      // Limpiar formulario
      setFormData({ 
        nombre_ruta: '',
        origen: '', 
        destino: '', 
        hora_inicio: '', 
        hora_fin: '', 
        dia: 'lunes' 
      });
      setCoordenadas({ origen: null, destino: null });
      setRutaGeojson(null);
    } catch (error) {
      alert('Error al guardar la ruta');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">
                {rutaEditar ? 'Editar Ruta' : 'Agregar Nueva Ruta'}
              </h3>
              <p className="text-sm text-blue-100 mt-1">
                Define tu ruta habitual y horario de disponibilidad
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-100px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Nombre de la ruta (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Nombre de la Ruta (opcional)
              </label>
              <input
                type="text"
                value={formData.nombre_ruta}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_ruta: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-blue-500 transition-all"
                placeholder="Ej: Casa - Trabajo, Ruta Matutina..."
              />
            </div>

            {/* Mapa - Mostrar primero para mejor UX */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-3 border-b-2 border-gray-300">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🗺️</span>
                  Mapa de Ruta
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Selecciona las direcciones exactas. La ruta se dibujará automáticamente.
                </p>
              </div>
              <div
                ref={mapContainer}
                className="w-full h-96"
                style={{ minHeight: '384px' }}
              />
              {coordenadas.origen && coordenadas.destino && (
                <div className="bg-white px-4 py-3 border-t-2 border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2 text-green-500"></span>
                      Origen
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="flex items-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full mr-2 text-red-500"></span>
                      Destino
                    </span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">✓ Ruta calculada</span>
                </div>
              )}
            </div>

            {/* Punto de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                  Punto de Inicio *
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.origen}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, origen: e.target.value }));
                    buscarDirecciones(e.target.value, 'origen');
                  }}
                  onFocus={() => {
                    if (sugerenciasOrigen.length > 0) setMostrarSugerenciasOrigen(true);
                  }}
                  onBlur={() => setTimeout(() => setMostrarSugerenciasOrigen(false), 200)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-green-500 transition-all"
                  placeholder="Escribe la dirección de inicio..."
                  required
                />
                
                {mostrarSugerenciasOrigen && sugerenciasOrigen.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-[60] mt-2 max-h-48 overflow-y-auto">
                    {sugerenciasOrigen.map((sug, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => seleccionarSugerencia(sug, 'origen')}
                        className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 flex items-center">
                          <span className="text-green-500 mr-2">📍</span>
                          {formatearDireccion(sug.place_name)}
                        </div>
                        <div className="text-sm text-gray-500 ml-6">
                          {sug.place_name.split(', ').slice(2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Punto de destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                  Punto de Destino *
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.destino}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, destino: e.target.value }));
                    buscarDirecciones(e.target.value, 'destino');
                  }}
                  onFocus={() => {
                    if (sugerenciasDestino.length > 0) setMostrarSugerenciasDestino(true);
                  }}
                  onBlur={() => setTimeout(() => setMostrarSugerenciasDestino(false), 200)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-red-500 transition-all"
                  placeholder="Escribe la dirección de destino..."
                  required
                />
                
                {mostrarSugerenciasDestino && sugerenciasDestino.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-[60] mt-2 max-h-48 overflow-y-auto">
                    {sugerenciasDestino.map((sug, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => seleccionarSugerencia(sug, 'destino')}
                        className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900 flex items-center">
                          <span className="text-red-500 mr-2">📍</span>
                          {formatearDireccion(sug.place_name)}
                        </div>
                        <div className="text-sm text-gray-500 ml-6">
                          {sug.place_name.split(', ').slice(2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Horario de disponibilidad */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-blue-500 mr-2">⏰</span>
                Horario de Disponibilidad
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Fin *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 Este será el período en el que estarás disponible para recibir pedidos en esta ruta
              </p>
            </div>

            {/* Día de la semana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Día de la Semana *
              </label>
              <select
                value={formData.dia}
                onChange={(e) => setFormData(prev => ({ ...prev, dia: e.target.value }))}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-blue-500"
                required
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>

            {/* Información de ayuda */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-amber-500 text-xl mr-3 mt-0.5">💡</span>
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">¿Cómo funciona?</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Define tu ruta diaria habitual (ejemplo: casa → trabajo)</li>
                    <li>• Establece tu horario de disponibilidad</li>
                    <li>• El sistema te mostrará negocios y pedidos cercanos a tu ruta</li>
                    <li>• Optimiza tu tiempo haciendo entregas en tu camino</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !coordenadas.origen || !coordenadas.destino}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  guardando || !coordenadas.origen || !coordenadas.destino
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {guardando ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Guardando...
                  </span>
                ) : (
                  <>
                    {rutaEditar ? '✓ Actualizar Ruta' : '✓ Guardar Ruta'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}