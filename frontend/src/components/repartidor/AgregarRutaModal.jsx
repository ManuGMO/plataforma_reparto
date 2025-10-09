// src/components/AgregarRutaModal.jsx
import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA';

export default function AgregarRutaModal({ isOpen, onClose, onGuardar, rutaEditar }) {
  const [formData, setFormData] = useState({
    origen: '',
    destino: '',
    horario: '',
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
  const [mostrarMapa, setMostrarMapa] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerOrigen = useRef(null);
  const markerDestino = useRef(null);
  const routeLine = useRef(null);

  // Cargar datos si es edición
  useEffect(() => {
    if (rutaEditar) {
      setFormData({
        origen: rutaEditar.origen,
        destino: rutaEditar.destino,
        horario: rutaEditar.horario,
        dia: rutaEditar.dia
      });
    }
  }, [rutaEditar]);

  // Inicializar mapa
  useEffect(() => {
    if (mostrarMapa && isOpen && mapContainer.current && !map.current) {
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
                'line-width': 4,
                'line-opacity': 0.75
              }
            });
          });
        } catch (error) {
          console.error('Error inicializando mapa:', error);
        }
      }, 200);
    }

    return () => {
      if (!isOpen && map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.error('Error limpiando mapa:', error);
        }
        map.current = null;
        markerOrigen.current = null;
        markerDestino.current = null;
      }
    };
  }, [mostrarMapa, isOpen]);

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
    
    setMostrarMapa(true);
  };

  // Actualizar marcadores en el mapa
  const actualizarMarcador = (lng, lat, tipo) => {
    if (!map.current || !map.current.loaded()) return;

    try {
      if (tipo === 'origen') {
        if (markerOrigen.current) markerOrigen.current.remove();
        markerOrigen.current = new mapboxgl.Marker({ color: '#22c55e' })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setText('Origen'))
          .addTo(map.current);
      } else {
        if (markerDestino.current) markerDestino.current.remove();
        markerDestino.current = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setText('Destino'))
          .addTo(map.current);
      }

      // Si ambos marcadores están colocados, dibujar ruta y ajustar vista
      if (coordenadas.origen && coordenadas.destino) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([coordenadas.origen.lng, coordenadas.origen.lat]);
        bounds.extend([coordenadas.destino.lng, coordenadas.destino.lat]);
        
        map.current.fitBounds(bounds, { padding: 80 });
        
        // Dibujar línea de ruta
        dibujarRuta();
      } else if (tipo === 'origen' && coordenadas.origen) {
        map.current.flyTo({ center: [lng, lat], zoom: 14 });
      } else if (tipo === 'destino' && coordenadas.destino) {
        map.current.flyTo({ center: [lng, lat], zoom: 14 });
      }
    } catch (error) {
      console.error('Error actualizando marcador:', error);
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
        `geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0].geometry;
        
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
    
    if (!formData.origen || !formData.destino || !formData.horario || !formData.dia) {
      alert('Por favor completa todos los campos');
      return;
    }

    setGuardando(true);
    
    try {
      await onGuardar(formData);
      // Limpiar formulario
      setFormData({ origen: '', destino: '', horario: '', dia: 'lunes' });
      setCoordenadas({ origen: null, destino: null });
      setMostrarMapa(false);
    } catch (error) {
      alert('Error al guardar la ruta');
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              {rutaEditar ? 'Editar Ruta' : 'Agregar Nueva Ruta'}
            </h3>
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
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Punto de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Punto de Inicio
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
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-blue-500 transition-all"
                  placeholder="Escribe la dirección de origen..."
                  required
                />
                
                {mostrarSugerenciasOrigen && sugerenciasOrigen.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50 mt-2 max-h-48 overflow-y-auto">
                    {sugerenciasOrigen.map((sug, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => seleccionarSugerencia(sug, 'origen')}
                        className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {formatearDireccion(sug.place_name)}
                        </div>
                        <div className="text-sm text-gray-500">
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
                📍 Punto de Destino
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
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-blue-500 transition-all"
                  placeholder="Escribe la dirección de destino..."
                  required
                />
                
                {mostrarSugerenciasDestino && sugerenciasDestino.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50 mt-2 max-h-48 overflow-y-auto">
                    {sugerenciasDestino.map((sug, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => seleccionarSugerencia(sug, 'destino')}
                        className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {formatearDireccion(sug.place_name)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sug.place_name.split(', ').slice(2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mapa */}
            {mostrarMapa && (
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                <div
                  ref={mapContainer}
                  className="w-full h-64"
                  style={{ minHeight: '256px' }}
                />
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 flex items-center">
                    <span className="text-green-500 mr-2">●</span> Origen
                    <span className="mx-3">→</span>
                    <span className="text-red-500 mr-2">●</span> Destino
                  </p>
                </div>
              </div>
            )}

            {/* Horario y Día */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏰ Horario
                </label>
                <input
                  type="time"
                  value={formData.horario}
                  onChange={(e) => setFormData(prev => ({ ...prev, horario: e.target.value }))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:ring-0 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Día de la Semana
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
            </div>

            {/* Información de ayuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-blue-500 text-xl mr-3 mt-0.5">💡</span>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Consejo</h4>
                  <p className="text-sm text-blue-800">
                    Agrega tus rutas diarias más frecuentes. El sistema te asignará pedidos 
                    que coincidan con tu trayecto para maximizar tu eficiencia.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  guardando
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {guardando ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Guardando...
                  </span>
                ) : (
                  rutaEditar ? 'Actualizar Ruta' : 'Guardar Ruta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}