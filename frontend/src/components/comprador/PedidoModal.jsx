import { useState, useEffect, useRef } from 'react';
import CalificacionModal from './CalificacionModal';

export const getStatusColor = (estado) => {
  const colors = {
    'en-espera': 'bg-gray-300 text-gray-800',
    'confirmado': 'bg-blue-100 text-blue-800',
    'preparando': 'bg-yellow-100 text-yellow-800',
    'esperando-repartidor': 'bg-pink-100 text-pink-800',
    'en-camino': 'bg-purple-100 text-purple-800',
    'entregado': 'bg-green-100 text-green-800',
    'cancelado': 'bg-red-100 text-red-800'
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (estado) => {
  const texts = {
    'en-espera': 'En espera',
    'confirmado': 'Confirmado',
    'preparando': 'En preparación',
    'esperando-repartidor': 'Esperando Repartidor',
    'en-camino': 'En camino',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  };
  return texts[estado] || estado;
};

export const getStatusIcon = (estado) => {
  const icons = {
    'esperando-repartidor': '⏱️',
    'confirmado': '✅',
    'preparando': '👨‍🍳',
    'en-camino': '🚲',
    'entregado': '📦',
    'cancelado': '❌'
  };
  return icons[estado] || '📋';
};

export const getProgressStep = (estado) => {
  const steps = {
    'confirmado': 1,
    'preparando': 2,
    'esperando-repartidor': 2,
    'en-camino': 3,
    'entregado': 4,
    'cancelado': 0
  };
  return steps[estado] || 1;
};

// ─── Mapa del comprador ──────────────────────────────────────────────────────

function PedidoMapa({ pedido }) {
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const buyerMarkerRef = useRef(null);
  const vendorMarkersRef = useRef([]);
  const driverMarkerRef = useRef(null);

  const ensureMapboxCss = () => {
    if (typeof document === 'undefined') return;
    if (!document.querySelector('link[data-mapbox-gl]')) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css');
      link.setAttribute('data-mapbox-gl', '1');
      document.head.appendChild(link);
    }
  };

  const initMap = async (centerLng, centerLat) => {
    try {
      ensureMapboxCss();
      const mb = (await import('mapbox-gl')).default || (await import('mapbox-gl'));
      mb.accessToken = MAPBOX_TOKEN;
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [centerLng, centerLat], zoom: 13 });
        return mapRef.current;
      }
      mapRef.current = new mb.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [centerLng, centerLat],
        zoom: 13
      });
      mapRef.current.addControl(new mb.NavigationControl());
      mapRef.current.on('load', () => {
        try { mapRef.current.resize && mapRef.current.resize(); } catch (e) { }
      });
      return mapRef.current;
    } catch (err) { console.error('initMap error', err); }
  };

  const clearRoute = (id = 'route') => {
    try {
      if (!mapRef.current) return;
      if (mapRef.current.getLayer && mapRef.current.getLayer(`${id}-line`)) {
        mapRef.current.removeLayer(`${id}-line`);
      }
      if (mapRef.current.getSource && mapRef.current.getSource(id)) {
        mapRef.current.removeSource(id);
      }
    } catch (e) { /* ignore */ }
  };

  const drawRoute = async (points, routeId = 'route', color = '#7c3aed') => {
    try {
      if (!MAPBOX_TOKEN || !mapRef.current || points.length < 2) return;
      const coords = points.map(p => `${p[0]},${p[1]}`).join(';');
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const route = data.routes && data.routes[0];
      if (!route) return;
      clearRoute(routeId);
      mapRef.current.addSource(routeId, {
        type: 'geojson',
        data: { type: 'Feature', geometry: route.geometry }
      });
      mapRef.current.addLayer({
        id: `${routeId}-line`,
        type: 'line',
        source: routeId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': 4 }
      });
      const mb = (await import('mapbox-gl')).default || (await import('mapbox-gl'));
      const coordsArr = route.geometry.coordinates;
      const bounds = coordsArr.reduce(
        (b, c) => b.extend([c[0], c[1]]),
        new mb.LngLatBounds(coordsArr[0], coordsArr[0])
      );
      mapRef.current.fitBounds(bounds, { padding: 50 });
    } catch (err) { console.error('Error dibujando ruta:', err); }
  };

  const placeMarker = async (type, lat, lng, label) => {
    try {
      if (!mapRef.current) return;
      const mb = (await import('mapbox-gl')).default || (await import('mapbox-gl'));
      const popup = new mb.Popup({ offset: 25 }).setHTML(
        `<div style="color:#000; font-weight:600;">${label}</div>`
      );
      if (type === 'buyer') {
        if (buyerMarkerRef.current) buyerMarkerRef.current.remove();
        buyerMarkerRef.current = new mb.Marker({ color: 'red' })
          .setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
      } else if (type === 'vendor') {
        const marker = new mb.Marker({ color: 'orange' })
          .setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
        vendorMarkersRef.current.push(marker);
      } else if (type === 'driver') {
        if (driverMarkerRef.current) driverMarkerRef.current.remove();
        driverMarkerRef.current = new mb.Marker({ color: '#2563eb' })
          .setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
      }
    } catch (err) { console.error('Error placeMarker', err); }
  };

  useEffect(() => {
    if (!pedido) return;
    let mounted = true;

    const setup = async () => {
      // ── 1. Determinar coords del comprador (destino de entrega) ──
      const buyerLat = pedido.lat_destino;
      const buyerLng = pedido.lng_destino;
      const hasBuyer = buyerLat != null && buyerLng != null && !isNaN(buyerLat) && !isNaN(buyerLng);

      // ── 2. Vendedores con coords ──
      const vendors = (pedido.vendedores_coords || []).filter(
        v => v.lat != null && v.lng != null && !isNaN(v.lat) && !isNaN(v.lng)
      );

      // ── 3. Repartidor ──
      const driver = pedido.repartidor;
      const hasDriver = driver && driver.lat != null && driver.lng != null &&
        !isNaN(driver.lat) && !isNaN(driver.lng);

      // ── 4. Centro del mapa ──
      let centerLat = -12.0464;
      let centerLng = -77.0428;
      if (hasBuyer) { centerLat = buyerLat; centerLng = buyerLng; }
      else if (vendors.length > 0) { centerLat = vendors[0].lat; centerLng = vendors[0].lng; }
      else if (hasDriver) { centerLat = driver.lat; centerLng = driver.lng; }

      await initMap(centerLng, centerLat);
      if (!mounted) return;

      // Esperar a que el mapa esté listo antes de añadir capas
      const waitForLoad = () => new Promise(resolve => {
        if (!mapRef.current) return resolve();
        if (mapRef.current.isStyleLoaded()) return resolve();
        mapRef.current.once('load', resolve);
      });
      await waitForLoad();
      if (!mounted) return;

      // ── 5. Marcadores ──
      if (hasBuyer) await placeMarker('buyer', buyerLat, buyerLng, 'Tu ubicación (entrega)');
      for (const v of vendors) await placeMarker('vendor', v.lat, v.lng, v.nombre || 'Vendedor');
      if (hasDriver) await placeMarker('driver', driver.lat, driver.lng, driver.nombre || 'Repartidor');

      // ── 6. Rutas según estado del pedido ──
      const estado = pedido.estado;

      if (estado === 'en-camino' || estado === 'entregado') {
        // Repartidor -> Comprador (ruta principal en azul)
        if (hasDriver && hasBuyer) {
          await drawRoute(
            [[driver.lng, driver.lat], [buyerLng, buyerLat]],
            'route-driver-buyer',
            '#2563eb'
          );
        }
        // Repartidor -> Vendedores pendientes (ruta gris si hay vendedores aún)
        if (hasDriver && vendors.length > 0) {
          const points = [[driver.lng, driver.lat], ...vendors.map(v => [v.lng, v.lat])];
          await drawRoute(points, 'route-driver-vendors', '#9ca3af');
        }
      } else if (estado === 'preparando' || estado === 'esperando-repartidor') {
        // Vendedor(es) -> Comprador (ruta naranja, para que el comprador entienda el trayecto futuro)
        if (vendors.length > 0 && hasBuyer) {
          const points = [...vendors.map(v => [v.lng, v.lat]), [buyerLng, buyerLat]];
          await drawRoute(points, 'route-vendors-buyer', '#f97316');
        }
      }
    };

    setup();

    return () => {
      mounted = false;
      try {
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      } catch (e) { }
      buyerMarkerRef.current = null;
      vendorMarkersRef.current = [];
      driverMarkerRef.current = null;
    };
  }, [pedido]);

  // Determinar si hay algo que mostrar en el mapa
  const hasMapData =
    (pedido.lat_destino != null && pedido.lng_destino != null) ||
    (pedido.vendedores_coords && pedido.vendedores_coords.length > 0) ||
    (pedido.repartidor && pedido.repartidor.lat != null);

  if (!hasMapData) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">🗺️ Mapa del pedido</h3>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span> Tu ubicación
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span> Vendedor
        </span>
        {pedido.tiene_repartidor && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-600"></span> Repartidor
          </span>
        )}
      </div>

      <div ref={mapContainerRef} className="w-full h-64 rounded-md overflow-hidden" />

      {/* Info repartidor bajo el mapa */}
      {pedido.repartidor && pedido.repartidor.lat != null && (
        <p className="text-xs text-gray-500 mt-2">
          📍 Ubicación del repartidor actualizada
        </p>
      )}
    </div>
  );
}

// ─── Modal principal ─────────────────────────────────────────────────────────

export default function PedidoModal({ pedido, showModal, onClose }) {
  const [showCalificacionModal, setShowCalificacionModal] = useState(false);

  if (!showModal || !pedido) return null;

  const handleCalificar = () => {
    setShowCalificacionModal(true);
  };

  const handleCalificacionEnviada = () => {

  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={onClose}
              className="mr-3 text-2xl hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ←
            </button>
            <h1 className="text-lg font-bold text-gray-900">Detalle del Pedido</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Order Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Estado del pedido</h3>
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((step) => {
                const currentStep = getProgressStep(pedido.estado);
                const isCompleted = step < currentStep;
                const isActive = step === currentStep;

                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                      }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Confirmado</span>
              <span>Preparando</span>
              <span>En camino</span>
              <span>Entregado</span>
            </div>
          </div>

          {/* Mapa */}
          <PedidoMapa pedido={pedido} />

          {/* Delivery Info - Solo mostrar si está en camino o entregado */}
          {(pedido.estado === 'en-camino' || pedido.estado === 'entregado') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Información del repartidor</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">👨‍🚴</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {pedido.repartidor?.nombre || 'Repartidor'}
                  </p>
                  <p className="text-sm text-gray-600">⭐ Valoracion del repartidor</p>
                  {pedido.repartidor?.telefono && (
                    <p className="text-sm text-green-600">📱 {pedido.repartidor.telefono}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Información del pedido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha</span>
                <span className="font-medium text-gray-400">{pedido.fecha}</span>
              </div>
              {pedido.direccion && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dirección</span>
                  <span className="font-medium text-right text-gray-400">📍 {pedido.direccion}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-3">
              {pedido.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {item.cantidad}x ${item.precio} c/u
                    </p>
                    {item.vendedor && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <span>Vendedor: {item.vendedor}</span>
                        {item.estado_vendedor && (
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${getStatusColor(item.estado_vendedor)}`}>
                            {getStatusText(item.estado_vendedor)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-green-600">${item.subtotal}</span>
                </div>
              ))}

              {/* Resumen de costos */}
              <div className="border-t pt-3 mt-3 space-y-2">

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${pedido.subtotal ?? pedido.items.reduce((sum, item) => sum + item.subtotal, 0)}</span>
                </div>

                {/* Comisión */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Comisión servicio</span>
                  <span className="text-gray-900">${pedido.comision ?? (pedido.total - (pedido.subtotal ?? pedido.items.reduce((sum, item) => sum + item.subtotal, 0)))}</span>
                </div>

                {/* Pago reparto */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pago reparto</span>
                  <span className="text-gray-900">${pedido.precio_reparto ?? 0}</span>
                </div>

                {/* Total final */}
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="font-semibold text-lg text-gray-900">Total</span>
                  <span className="font-bold text-lg text-green-600">${pedido.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rate Order Button - Solo mostrar si está entregado y no ha sido calificado */}
          {pedido.estado === 'entregado' && !pedido.ya_calificado && (
            <button
              onClick={handleCalificar}
              className="w-full bg-yellow-500 text-white py-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
            >
              ⭐ Calificar Experiencia
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
        <CalificacionModal
          pedido={pedido}
          showModal={showCalificacionModal}
          onClose={() => setShowCalificacionModal(false)}
          id_comprador={pedido.id_comprador}
          onCalificacionEnviada={handleCalificacionEnviada}
        />
      </div>
    </div>
  );
}