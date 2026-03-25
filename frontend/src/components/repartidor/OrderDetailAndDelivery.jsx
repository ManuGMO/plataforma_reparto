import { useState, useEffect, useRef } from 'react';

export default function OrderDetailAndDelivery({ order, currentView, onBack, onAccept, onConfirmPickup, onConfirmDelivery, notification, setNotification, loading }) {
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorCoords, setVendorCoords] = useState(null);
  // Mapbox token (mejor mover a env más adelante)
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const orderMarkerRef = useRef(null);
  const vendorMarkersRef = useRef([]);
  const driverMarkerRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  console.log('OrderDetailAndDelivery order:', order, 'view:', currentView);

  const getOrderCoords = (o) => {
    if (!o) return null;
    const candidates = [
      { lat: o.latitud, lng: o.longitud },
      { lat: o.lat, lng: o.lng },
      { lat: o.lat_destino, lng: o.lng_destino },
      { lat: o.latitude, lng: o.longitude },
      { lat: o.Comprador && o.Comprador[0] && o.Comprador[0].latitud, lng: o.Comprador && o.Comprador[0] && o.Comprador[0].longitud },
      { lat: o.comprador && o.comprador.latitud, lng: o.comprador && o.comprador.longitud }
    ];
    for (const c of candidates) {
      if (c && c.lat != null && c.lng != null) {
        const lat = Number(c.lat);
        const lng = Number(c.lng);
        if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
      }
    }
    return null;
  };

  const fetchVendorCoords = async (vendorId) => {
    try {
      if (!vendorId) return null;
      const res = await fetch(`${API_URL}/api/usuarios/${vendorId}`);
      const payload = await res.json();
      if (payload && payload.success && payload.usuario) {
        const u = payload.usuario;
        if (u.latitud != null && u.longitud != null) return { lat: Number(u.latitud), lng: Number(u.longitud) };
      }
    } catch (err) { console.warn('No se pudo obtener coords vendedor', err); }
    return null;
  };

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
      const mapboxgl = await import('mapbox-gl');
      mapboxgl.accessToken = MAPBOX_TOKEN;
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [centerLng, centerLat], zoom: 13 });
        return mapRef.current;
      }
      mapRef.current = new (await import('mapbox-gl')).Map({ container: mapContainerRef.current, style: 'mapbox://styles/mapbox/streets-v11', center: [centerLng, centerLat], zoom: 13 });
      mapRef.current.addControl(new (await import('mapbox-gl')).NavigationControl());
      mapRef.current.on('load', () => {
        try { mapRef.current.resize && mapRef.current.resize(); } catch (e) { }
      });
      return mapRef.current;
    } catch (err) { console.error('initMap error', err); }
  };

  const clearRoute = () => {
    try {
      if (!mapRef.current) return;
      if (mapRef.current.getLayer && mapRef.current.getLayer('route-line')) {
        mapRef.current.removeLayer('route-line');
      }
      if (mapRef.current.getSource && mapRef.current.getSource('route')) {
        mapRef.current.removeSource('route');
      }
    } catch (e) { /* ignore */ }
  };

  const drawRoute = async (points) => {
    try {
      if (!MAPBOX_TOKEN || !mapRef.current || points.length < 2) return;

      const coords = points.map(p => `${p[0]},${p[1]}`).join(';');
      const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`);

      if (!res.ok) return;
      const data = await res.json();
      const route = data.routes && data.routes[0];
      if (!route) return;
      const routeGeo = route.geometry;
      clearRoute();
      mapRef.current.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: routeGeo } });
      mapRef.current.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 5 } });
      const coordsArr = routeGeo.coordinates;
      const mb = await import('mapbox-gl');
      const bounds = coordsArr.reduce((b, c) => b.extend([c[0], c[1]]), new mb.LngLatBounds(coordsArr[0], coordsArr[0]));
      mapRef.current.fitBounds(bounds, { padding: 50 });
    } catch (err) { console.error('Error dibujando ruta:', err); }
  };

  const placeMarker = async (type, lat, lng, labelOverride, estado_pedido) => {
    try {
      if (!mapRef.current) return;
      const mapboxgl = await import('mapbox-gl');
      // determinar etiqueta según el tipo y el estado actual
      let label = labelOverride || '';
      if (!labelOverride) {
        if (type === 'order') label = customerName || 'Comprador';
        else if (type === 'vendor') label = vendorName || 'Vendedor';
        else if (type === 'driver') label = 'Tu ubicación';
      }

      // usar HTML para forzar color de texto negro en el popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style="color:#000; font-weight:600;">${label}</div>`);

      if (type === 'order') {
        if (orderMarkerRef.current) orderMarkerRef.current.remove();
        orderMarkerRef.current = new mapboxgl.Marker({ color: 'red' }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
      } else if (type === 'vendor') {
        let color = 'orange'; // Por defecto: preparando o pendiente
        if (estado_pedido === 'listo_para_recoger') color = 'green';
        else if (estado_pedido === 'en_reparto') color = 'gray'; // ya recogido

        const marker = new mapboxgl.Marker({ color }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
        vendorMarkersRef.current.push(marker);
      } else if (type === 'driver') {
        if (driverMarkerRef.current) driverMarkerRef.current.remove();
        driverMarkerRef.current = new mapboxgl.Marker({ color: 'blue' }).setLngLat([lng, lat]).setPopup(popup).addTo(mapRef.current);
      }
    } catch (err) { console.error('Error placeMarker', err); }
  };

  const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => v * Math.PI / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const [driverDistanceToVendor, setDriverDistanceToVendor] = useState(null);
  const [driverDistanceToDestination, setDriverDistanceToDestination] = useState(null);

  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      if (!order) return;
      // obtener coords de destino (cliente)
      const dest = getOrderCoords(order);

      // procesar coords de todos los vendedores
      let validVendors = [];
      if (order.vendedores && order.vendedores.length > 0) {
        validVendors = order.vendedores
          .filter(v => v.latitud != null && v.longitud != null && v.estado_pedido !== 'rechazado' && v.estado_pedido !== 'cancelado')
          .map(v => ({ ...v, lat: Number(v.latitud), lng: Number(v.longitud) }));
      } else {
        let vCoords = null;
        const vendorId = order.id_vendedor || order.vendedor?.id_usuario || order.Vendedor?.[0]?.id_usuario || order.vendedor_id;
        if (order.Vendedor?.[0]?.latitud && order.Vendedor?.[0]?.longitud) {
          vCoords = { lat: Number(order.Vendedor[0].latitud), lng: Number(order.Vendedor[0].longitud) };
          validVendors.push({ nombre: order.Vendedor[0].nombre, lat: vCoords.lat, lng: vCoords.lng });
        } else if (vendorId) {
          vCoords = await fetchVendorCoords(vendorId);
          if (vCoords) {
            validVendors.push({ nombre: vendorName, lat: vCoords.lat, lng: vCoords.lng });
          }
        }
      }

      if (!mounted) return;
      setVendorCoords(validVendors);

      // Inicializar mapa centrado alrededor del destino o el primer vendedor
      const center = (() => {
        if (validVendors.length > 0 && dest) return { lat: (validVendors[0].lat + dest.lat) / 2, lng: (validVendors[0].lng + dest.lng) / 2 };
        if (validVendors.length > 0) return { lat: validVendors[0].lat, lng: validVendors[0].lng };
        if (dest) return { lat: dest.lat, lng: dest.lng };
        return { lat: -12.0464, lng: -77.0428 };
      })();

      await initMap(center.lng, center.lat);

      // colocar marcadores iniciales: vendedores y destino
      if (validVendors.length > 0) {
        for (const v of validVendors) {
          await placeMarker('vendor', v.lat, v.lng, v.nombre, v.estado_pedido);
        }
      }
      if (dest) await placeMarker('order', dest.lat, dest.lng);

      // siempre intentar obtener la ubicación actual del repartidor para mostrarla en el mapa
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const dlat = pos.coords.latitude; const dlng = pos.coords.longitude;
          await placeMarker('driver', dlat, dlng);

          let closestVendorDist = null;
          let closestVendor = null;

          if (validVendors.length > 0) {
            for (const v of validVendors) {
              const dist = Math.round(haversineMeters(dlat, dlng, v.lat, v.lng));
              if (closestVendorDist === null || dist < closestVendorDist) {
                closestVendorDist = dist;
                closestVendor = v;
              }
            }
            setDriverDistanceToVendor(closestVendorDist);
          }
          if (dest) setDriverDistanceToDestination(Math.round(haversineMeters(dlat, dlng, dest.lat, dest.lng)));

          // si el pedido ya tiene repartidor, comportamiento múltiple o directo
          if (order.tiene_repartidor) {
            if (order.estado === 'listo_para_recoger' || order.estado === 'aceptado') {
              // si estamos recogiendo, trazar ruta por todos los vendedores que faltan por recoger
              const pendingVendors = validVendors.filter(v => v.estado_pedido !== 'en_reparto');
              if (pendingVendors.length > 0) {
                const routingPoints = [[dlng, dlat]];

                // Ordenar por distancia más cercana secuencialmente (algoritmo avaro)
                let currentPos = { lat: dlat, lng: dlng };
                let unvisited = [...pendingVendors];

                while (unvisited.length > 0) {
                  let nearestIdx = 0;
                  let nearestDist = haversineMeters(currentPos.lat, currentPos.lng, unvisited[0].lat, unvisited[0].lng);

                  for (let i = 1; i < unvisited.length; i++) {
                    const d = haversineMeters(currentPos.lat, currentPos.lng, unvisited[i].lat, unvisited[i].lng);
                    if (d < nearestDist) {
                      nearestDist = d;
                      nearestIdx = i;
                    }
                  }

                  const nextV = unvisited.splice(nearestIdx, 1)[0];
                  routingPoints.push([nextV.lng, nextV.lat]);
                  currentPos = nextV;
                }

                await drawRoute(routingPoints);
              }
            }
            if (order.estado === 'en_reparto' && dest) await drawRoute([[dlng, dlat], [dest.lng, dest.lat]]);
          } else {
            // pedido aún no aceptado: ruta por todos los vendedores
            if (validVendors.length > 0) {
              const routingPoints = [[dlng, dlat]];
              validVendors.forEach(v => routingPoints.push([v.lng, v.lat]));
              await drawRoute(routingPoints);
            }
          }
        }, (err) => { /* ignore */ }, { enableHighAccuracy: true, timeout: 8000 });
      }
    };
    setup();
    return () => {
      mounted = false;
      try { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } } catch (e) { }
      orderMarkerRef.current = null; vendorMarkersRef.current = []; driverMarkerRef.current = null;
    };
  }, [order]);

  const getCurrentStep = () => {
    if (!order.tiene_repartidor) return 1;
    if (order.estado === 'aceptado' || order.estado === 'listo_para_recoger') return 2;
    if (order.estado === 'en_reparto') return 3;
    if (order.estado === 'entregado') return 4;
    return 1;
  };

  const currentStep = getCurrentStep();

  if (!order) return null;

  const vendorName = order.vendedores?.length > 1 ? 'Múltiples vendedores' : (order.vendedores?.[0]?.nombre || order.Vendedor?.[0]?.nombre || order.vendedor?.nombre || 'Restaurante');
  const customerName = order.Comprador?.[0]?.nombre || order.comprador?.nombre || 'Cliente';

  const steps = [{ id: 1, label: 'Disponible', icon: '1' }, { id: 2, label: 'Recoger', icon: '2' }, { id: 3, label: 'Entregar', icon: '3' }];

  const getCurrentAction = () => {
    if (!order.tiene_repartidor) return { text: `Acepta este pedido para comenzar el reparto`, address: '', button: '🚲 Aceptar Pedido', action: 'accept' };
    switch (currentStep) {
      case 2:
        // Si hay múltiples vendedores, verificar estado individualmente
        if (order.vendedores && order.vendedores.length > 0) {
          const vendorsToPickup = order.vendedores.filter(v => v.estado_pedido === 'listo_para_recoger');
          const vendorsWaiting = order.vendedores.filter(v => v.estado_pedido === 'aceptado' || v.estado_pedido === 'preparando' || v.estado_pedido === 'pendiente');

          if (vendorsToPickup.length > 0) {
            return {
              text: `Recoger pedido de ${vendorsToPickup[0].nombre}.`,
              address: vendorAddress || 'Dirección del vendedor',
              button: `📦 Confirmar Recogida (${vendorsToPickup[0].nombre})`,
              action: 'pickup_vendor',
              vendorIdToPickup: vendorsToPickup[0].id_usuario
            };
          }
          if (vendorsWaiting.length > 0) {
            return { text: `Dirígete a ${vendorsWaiting[0].nombre}. Esperando que el pedido esté listo.`, address: vendorAddress || 'Dirección del vendedor', button: '⏳ Esperando preparación...', action: 'wait' };
          }
          // Todos recogidos, pero globalmente no avanzado a en_reparto
          return { text: `Todos los pedidos recogidos. Iniciando reparto.`, address: '', button: '🔄 Sincronizando...', action: 'wait' };
        } else {
          if (order.estado === 'aceptado') {
            return { text: `Dirígete a ${vendorName}. Esperando que el pedido esté listo.`, address: vendorAddress || 'Dirección del vendedor', button: '⏳ Esperando preparación...', action: 'wait' };
          }
          return { text: `Pedido listo en ${vendorName}. Confirma la recogida.`, address: vendorAddress || 'Dirección del vendedor', button: '📦 Confirmar Recogida', action: 'pickup' };
        }
      case 3: return { text: `Entregar pedido a ${customerName}`, address: order.direccion || 'Dirección del cliente', button: '✅ Confirmar Entrega', action: 'delivery' };
      default: return { text: 'Entrega completada', address: '', button: 'Finalizar', action: 'complete' };
    }
  };

  const handleAction = async () => {
    const currentAction = getCurrentAction();
    let success = false;
    switch (currentAction.action) {
      case 'accept': {
        // al aceptar, obtener ubicación actual del repartidor y dibujar ruta repartidor -> vendedor
        success = await onAccept(order.id_pedido);
        if (success && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const driverLat = position.coords.latitude; const driverLng = position.coords.longitude;
            await placeMarker('driver', driverLat, driverLng);
            if (vendorCoords && vendorCoords.length > 0) await drawRoute([driverLng, driverLat], [vendorCoords[0].lng, vendorCoords[0].lat]);
          }, (err) => { console.warn('geo err', err); }, { enableHighAccuracy: true, timeout: 10000 });
        }
        break;
      }
      case 'pickup':
      case 'pickup_vendor': {
        // En un pickup_vendor, enviar el vendorId para recoger solo ese, si el backend está listo, si no, recoge todo
        const vendorIdToPickup = currentAction.vendorIdToPickup;
        // al confirmar recogida, dibujar ruta repartidor -> destino (o siguiente vendedor)
        success = await onConfirmPickup(order.id_pedido, vendorIdToPickup);
        if (success && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const driverLat = position.coords.latitude; const driverLng = position.coords.longitude;
            await placeMarker('driver', driverLat, driverLng);

            // Re-evaluar qué falta
            if (order.vendedores) {
              const remainingVendors = order.vendedores.filter(v => v.estado_pedido !== 'en_reparto' && v.id_usuario !== vendorIdToPickup);
              if (remainingVendors.length > 0) {
                // Faltan vendedores, redibujar ruta hacia ellos
                const rpoints = [[driverLng, driverLat]];
                remainingVendors.forEach(v => rpoints.push([Number(v.longitud), Number(v.latitud)]));
                await drawRoute(rpoints);
                return;
              }
            }

            // Ya no faltan, trazar ruta al destino
            const dest = getOrderCoords(order);
            if (dest) await drawRoute([[driverLng, driverLat], [dest.lng, dest.lat]]);
          }, (err) => { console.warn('geo err', err); }, { enableHighAccuracy: true, timeout: 10000 });
        }
        break;
      }
      case 'delivery': {
        success = await onConfirmDelivery(order.id_pedido);
        break;
      }
    }
  };

  useEffect(() => {
    // procesar dirección del vendedor si hace falta (display)
    const procesarDireccionVendedor = async () => {
      if (!order) return setVendorAddress('Dirección no disponible');

      // Si hay múltiples vendedores, podemos mostrar varios o uno genérico
      if (order.vendedores && order.vendedores.length > 1) {
        return setVendorAddress(`Múltiples vendedores (${order.vendedores.length})`);
      }

      if (order.Vendedor?.[0]?.direccion) return setVendorAddress(order.Vendedor[0].direccion);

      if (vendorCoords && vendorCoords.length > 0) {
        setLoadingAddress(true);
        try {
          const direccion = await (async (lat, lng) => {
            try {
              const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place&language=es&limit=1`);
              if (!response.ok) return 'Dirección no disponible';
              const data = await response.json();
              if (data.features && data.features.length > 0) return data.features[0].place_name.split(',').slice(0, 2).join(',');
            } catch (e) { console.warn(e); }
            return 'Dirección no disponible';
          })(vendorCoords[0].lat, vendorCoords[0].lng);
          setVendorAddress(direccion);
        } finally { setLoadingAddress(false); }
      }
    };
    procesarDireccionVendedor();
  }, [order, vendorCoords]);

  return (
    <div className="min-h-screen bg-white">
      {notification && (<div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3"><div className="flex justify-between items-center"><span>{notification}</span><button onClick={() => setNotification('')} className="text-blue-700 font-bold">×</button></div></div>)}
      <header className="bg-white text-black border-2 border-green-600 rounded-2xl mx-4 mt-4 shadow-sm">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={onBack} className="mr-3 text-black bg-white border-black px-4 py-1 ">⭠</button>
              <div>
                <h1 className="text-lg font-bold text-black">{!order.tiene_repartidor ? 'Pedido Disponible' : 'Entrega en Progreso'}</h1>
                <p className="text-sm text-black">Pedido #{order.id_pedido}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-black">${order.total}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="p-4 space-y-6">
        {order.tiene_repartidor && (<div className="bg-white border rounded-lg p-4"><div className="flex items-center justify-between mb-4">{steps.map((step, index) => (<div key={step.id} className="flex items-center"><div className="step-item flex flex-col items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.id <= currentStep ? step.id === 1 ? 'bg-green-600 text-white' : step.id === currentStep ? 'bg-blue-600 text-white' : 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>{step.id <= currentStep && step.id !== currentStep ? '✓' : step.icon}</div><span className="text-xs text-gray-600 mt-1">{step.label}</span></div>{index < steps.length - 1 && (<div className={`flex-1 h-1 mx-2 ${step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'}`} style={{ width: '50px' }}></div>)}</div>))}</div></div>)}
        <div className="bg-white border rounded-lg p-4"><h3 className="font-semibold text-gray-900 mb-3">Detalles del Pedido</h3><div className="space-y-3">
          <div><p className="text-sm text-gray-600">Recoger en:</p><p className="font-medium text-gray-500">{vendorName}</p><p className="text-sm text-gray-500"> 📍{loadingAddress ? (<span className="inline-flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-2"></div>Obteniendo dirección...</span>) : vendorAddress}</p></div>
          <div><p className="text-sm text-gray-600">Entregar a:</p><p className="font-medium text-gray-500">{customerName}</p><p className="text-sm text-gray-500">📍 {order.direccion.split(',').slice(0, 2).join(',') || 'Dirección del cliente'}</p></div>
          <div><p className="text-sm text-gray-600">Productos y Vendedores:</p>
            <div className="space-y-3">
              {order.vendedores && order.vendedores.length > 0 ? (
                order.vendedores.map((vendor, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded border text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-800">{vendor.nombre}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vendor.estado_pedido === 'listo_para_recoger' ? 'bg-green-100 text-green-800' : vendor.estado_pedido === 'en_reparto' ? 'bg-gray-200 text-gray-800' : 'bg-orange-100 text-orange-800'}`}>
                        {vendor.estado_pedido === 'en_reparto' ? 'Recogido' : vendor.estado_pedido === 'listo_para_recoger' ? 'Listo para Recoger' : 'Preparando'}
                      </span>
                    </div>
                    {order.productos?.filter(p => p.id_usuario === vendor.id_usuario || !p.id_usuario).map((producto, pIdx) => (
                      <div key={pIdx} className="flex justify-between text-gray-600 pl-2 border-l-2 border-gray-200 mt-1">
                        <span>{producto.nombre}</span><span>x{producto.cantidad || producto.Producto_Pedido?.cantidad || 1}</span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="space-y-1">{order.productos?.map((producto, index) => (<div key={index} className="flex justify-between text-sm text-gray-400"><span>{producto.nombre}</span><span>x{producto.Producto_Pedido?.cantidad || 1}</span></div>)) || (<p className="text-sm text-gray-500">Cargando productos...</p>)}</div>
              )}
            </div>
          </div>
          <div className="pt-2 border-t space-y-2">
            <div className="flex justify-between text-sm"><span className='font-semibold text-gray-700'>Subtotal:</span><span className="text-gray-700">${order.precio_bruto || order.subtotal || 0}</span></div>
            <div className="flex justify-between text-sm"><span className='font-semibold text-gray-700'>Comisión servicio:</span><span className="text-gray-700">${order.comision_servicio || 0}</span></div>
            <div className="flex justify-between text-sm"><span className='font-semibold text-gray-700'>Ganancia del repartidor:</span><span className="text-gray-700">${order.pago_reparto || order.precio_reparto || 0}</span></div>
            <div className="flex justify-between font-semibold"><span className='font-semibold text-gray-700'>Total:</span><span className="text-green-600">${order.total}</span></div></div></div></div>

        {(getOrderCoords(order)) ? (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Mapa</h3>
            <div ref={mapContainerRef} className="w-full h-64 rounded-md overflow-hidden" />
            <div className="mt-3 text-sm text-gray-600">
              {driverDistanceToVendor != null && (
                <div>Distancia vendedor: <span className="font-medium">{driverDistanceToVendor} m</span></div>
              )}
              {driverDistanceToDestination != null && (
                <div>Distancia repartidor→destino: <span className="font-medium">{driverDistanceToDestination} m</span></div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-4"><p className="text-sm text-gray-500">Ubicación del cliente no disponible</p></div>
        )}
        <button onClick={handleAction} disabled={loading || getCurrentAction().action === 'wait'} className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">{loading ? 'Procesando...' : getCurrentAction().button}</button>
      </div>
    </div>
  );
}
