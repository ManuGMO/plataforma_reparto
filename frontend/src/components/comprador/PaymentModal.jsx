// src/components/PaymentModal.jsx
import { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import PaymentReceiptModal from "./PaymentReceiptModal";
import axios from "axios";

// Configurar tu token de Mapbox (regístrate en https://mapbox.com)
mapboxgl.accessToken = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA';

import { useAuth } from "../../contexts/AuthContext";

export default function PaymentModal({ isOpen, onClose, carritoData, onConfirmOrder }) {
  const { user } = useAuth();
  const [direccion, setDireccion] = useState("");
  const [direccionCompleta, setDireccionCompleta] = useState(""); // Para guardar en DB
  const [metodoPago, setMetodoPago] = useState("transfer");
  const [procesando, setProcesando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [cargandoGeolocalizacion, setCargandoGeolocalizacion] = useState(false);
  const [indiceSugerenciaActiva, setIndiceSugerenciaActiva] = useState(-1);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const inputRef = useRef(null);
  const sugerenciasRef = useRef(null);


  // Cargar ubicación del perfil si existe
  // Cargar ubicación del perfil si existe al abrir
  useEffect(() => {
    // Solo intentar si está abierto y no tenemos ubicación establecida manualmente aún
    if (isOpen && user && !ubicacion) {
      const lat = parseFloat(user.latitud);
      const lng = parseFloat(user.longitud);

      if (!isNaN(lat) && !isNaN(lng)) {
        actualizarUbicacion(lng, lat);
        // Solo buscar dirección si no hay una escrita (aunque usualmente estará vacía al abrir)
        if (!direccion) {
          geocodificarInverso(lng, lat);
        }
      }
    }
  }, [isOpen, user]); // Se ejecuta al montar (por key en padre) o si user carga tarde

  // Limpiar estado al cerrar el modal (por si se usa sin desmontar)
  useEffect(() => {
    if (!isOpen) {
      setDireccion("");
      setDireccionCompleta("");
      setUbicacion(null);
      setSugerencias([]);
      setMostrarMapa(false);
      setMostrarSugerencias(false);
      setIndiceSugerenciaActiva(-1);
    }
  }, [isOpen]);

  // Inicializar mapa cuando se muestra y activar marcador si existe ubicación
  useEffect(() => {
    if (mostrarMapa && mapContainer.current && !map.current) {
      const center = ubicacion ? [ubicacion.lng, ubicacion.lat] : [-70.6693, -33.4489];
      const zoom = ubicacion ? 15 : 13;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center,
        zoom: zoom
      });

      // Si ya hay ubicación, poner el marcador
      if (ubicacion) {
        marker.current = new mapboxgl.Marker({
          color: '#22c55e',
          scale: 1.2
        })
          .setLngLat([ubicacion.lng, ubicacion.lat])
          .addTo(map.current);
      } else {
        // Obtener ubicación del usuario automáticamente solo si no hay ubicación predefinida
        obtenerUbicacionUsuario();
      }

      // Agregar evento de click en el mapa
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        actualizarUbicacion(lng, lat);
        geocodificarInverso(lng, lat);
      });
    }
  }, [mostrarMapa]);

  // Función para obtener ubicación del usuario
  const obtenerUbicacionUsuario = () => {
    setCargandoGeolocalizacion(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;

          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 15
            });
          }

          actualizarUbicacion(longitude, latitude);
          geocodificarInverso(longitude, latitude);
          setCargandoGeolocalizacion(false);
        },
        (error) => {
          console.log("Error obteniendo geolocalización:", error);
          setCargandoGeolocalizacion(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const calcularComision = (total) => {
    const comision = 500 + (total * 0.07);
    return Math.min(comision, 2500); // límite superior
  }

  // En tu modal, muestra la comisión junto al resumen:
  const comisionAplicacion = calcularComision(carritoData.total);

  // Función para actualizar marcador en el mapa
  const actualizarUbicacion = (lng, lat) => {
    setUbicacion({ lng, lat });

    if (map.current) {
      if (marker.current) {
        marker.current.remove();
      }

      marker.current = new mapboxgl.Marker({
        color: '#22c55e',
        scale: 1.2
      })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  };

  // Función para formatear dirección (solo dirección y ciudad para mostrar)
  const formatearDireccionDisplay = (placeName) => {
    const partes = placeName.split(', ');
    // Tomar las primeras 2 partes: dirección y ciudad
    return partes.slice(0, 2).join(', ');
  };

  // Geocodificación inversa
  const geocodificarInverso = async (lng, lat) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=es`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        setDireccion(formatearDireccionDisplay(feature.place_name));
        setDireccionCompleta(feature.place_name);
      }
    } catch (error) {
      console.error("Error en geocodificación inversa:", error);
    }
  };

  // Autocompletado de direcciones
  const buscarDirecciones = async (query) => {
    if (query.length < 3) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    try {
      const proximity = ubicacion ? `${ubicacion.lng},${ubicacion.lat}` : '-70.6693,-33.4489';

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxgl.accessToken}&` +
        `proximity=${proximity}&` +
        `country=CL&` +
        `language=es&` +
        `limit=5`
      );

      const data = await response.json();
      setSugerencias(data.features || []);
      setMostrarSugerencias((data.features || []).length > 0);
      setIndiceSugerenciaActiva(-1);
    } catch (error) {
      console.error("Error buscando direcciones:", error);
    }
  };

  // Manejar cambio en el input de dirección
  const handleDireccionChange = (e) => {
    const valor = e.target.value;
    setDireccion(valor);
    setDireccionCompleta(valor); // Mientras escribe, ambos son iguales
    buscarDirecciones(valor);
  };

  // Manejar teclas de navegación
  const handleKeyDown = (e) => {
    if (!mostrarSugerencias || sugerencias.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceSugerenciaActiva(prev =>
          prev < sugerencias.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setIndiceSugerenciaActiva(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (indiceSugerenciaActiva >= 0 && indiceSugerenciaActiva < sugerencias.length) {
          seleccionarSugerencia(sugerencias[indiceSugerenciaActiva]);
        }
        break;

      case 'Escape':
        setMostrarSugerencias(false);
        setIndiceSugerenciaActiva(-1);
        break;

      case 'Tab':
        if (indiceSugerenciaActiva >= 0 && indiceSugerenciaActiva < sugerencias.length) {
          e.preventDefault();
          seleccionarSugerencia(sugerencias[indiceSugerenciaActiva]);
        }
        break;
    }
  };

  // Seleccionar sugerencia de dirección
  const seleccionarSugerencia = (sugerencia) => {
    setDireccion(formatearDireccionDisplay(sugerencia.place_name));
    setDireccionCompleta(sugerencia.place_name); // Guardar completa para DB
    setSugerencias([]);
    setMostrarSugerencias(false);
    setIndiceSugerenciaActiva(-1);

    const [lng, lat] = sugerencia.center;
    actualizarUbicacion(lng, lat);

    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 1000
      });
    }
  };

  // Manejar foco en el input
  const handleInputFocus = () => {
    setMostrarMapa(true);
    if (sugerencias.length > 0) {
      setMostrarSugerencias(true);
    }
  };

  // Manejar blur del input (con delay para permitir clicks en sugerencias)
  const handleInputBlur = () => {
    setTimeout(() => {
      setMostrarSugerencias(false);
      setIndiceSugerenciaActiva(-1);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!direccion.trim() || !ubicacion) return;

    // Guardar datos temporales para pasarlos al modal de comprobante
    setPedidoCreado({
      direccion: direccionCompleta,
      direccionDisplay: direccion,
      metodoPago,
      latitud: ubicacion.lat,
      longitud: ubicacion.lng,
      carritoData
    });

    // Abrir modal de comprobante sin crear el pedido todavía
    setShowReceiptModal(true);
  };

  // Manejar subida de comprobante
  const handleUploadReceipt = async (file) => {
    try {
      // Crear el pedido CON el comprobante en una sola operación
      const result = await onConfirmOrder({
        direccion: pedidoCreado.direccion,
        direccionDisplay: pedidoCreado.direccionDisplay,
        metodoPago: pedidoCreado.metodoPago,
        latitud: pedidoCreado.latitud,
        longitud: pedidoCreado.longitud,
        comprobante: file // Pasar el archivo también
      });

      // Cerrar modal de recibo
      setShowReceiptModal(false);

      // Mostrar modal de éxito
      setShowSuccessMessage(true);

      // Esperar unos segundos antes de cerrar el modal principal
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();

        // Limpiar estado
        setDireccion("");
        setDireccionCompleta("");
        setUbicacion(null);
        setSugerencias([]);
        setMostrarMapa(false);
        setMostrarSugerencias(false);
        setPedidoCreado(null);
      }, 2500);

    } catch (error) {
      console.error('Error creando pedido con comprobante:', error);
      throw error;
    }
  };

  // Cerrar modal de comprobante
  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    // No cerrar el modal principal para permitir modificaciones
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md mt-8 max-h-[95vh] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-green-600 text-white">
          <div className="px-4 py-4 flex items-center">
            <button
              onClick={onClose}
              className="mr-3 text-2xl hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition-all"
            >
              ←
            </button>
            <h1 className="text-lg font-bold">Confirmar Pedido</h1>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Dirección con autocompletado mejorado */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-green-500 mr-2">📍</span>
                  Dirección de entrega
                </h3>

                <div className="relative">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={direccion}
                      onChange={handleDireccionChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onKeyDown={handleKeyDown}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg text-gray-800 focus:ring-0 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Escribe tu dirección aquí..."
                      autoComplete="off"
                      required
                    />
                    {cargandoGeolocalizacion && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {/* Sugerencias de autocompletado mejoradas */}
                  {mostrarSugerencias && sugerencias.length > 0 && (
                    <div
                      ref={sugerenciasRef}
                      className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-[60] max-h-60 overflow-y-auto mt-2"
                    >
                      {sugerencias.map((sugerencia, idx) => (
                        <div
                          key={idx}
                          onMouseDown={() => seleccionarSugerencia(sugerencia)}
                          className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer ${idx === indiceSugerenciaActiva ? 'bg-green-100 border-green-200' : ''
                            }`}
                        >
                          <div className="flex items-start">
                            <span className="text-green-500 mr-3 mt-0.5">📍</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatearDireccionDisplay(sugerencia.place_name)}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {sugerencia.place_name.split(', ').slice(2).join(', ')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
                        <span>↑↓ Navegar • Enter Seleccionar • Esc Cerrar</span>
                      </div>
                    </div>
                  )}
                </div>

                {cargandoGeolocalizacion && (
                  <p className="text-sm text-blue-600 mt-3 flex items-center">
                    <span className="animate-pulse mr-2">🔍</span>
                    Detectando tu ubicación...
                  </p>
                )}
              </div>

              {/* Mapa mejorado */}
              {mostrarMapa && isOpen && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="text-blue-500 mr-2">🗺️</span>
                      Confirmar ubicación
                    </h3>
                    <button
                      type="button"
                      onClick={obtenerUbicacionUsuario}
                      disabled={cargandoGeolocalizacion}
                      className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md"
                    >
                      {cargandoGeolocalizacion ? (
                        <span className="flex items-center">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Ubicando...
                        </span>
                      ) : (
                        <>📍 Mi ubicación</>
                      )}
                    </button>
                  </div>

                  <div
                    ref={mapContainer}
                    className="h-72 rounded-xl overflow-hidden shadow-inner border-2 border-gray-200"
                    style={{ minHeight: '288px' }}
                  />

                  <div className="mt-3 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-600 flex items-center mb-1">
                      <span className="text-green-500 mr-1">💡</span>
                      Haz clic en el mapa para ajustar la ubicación exacta
                    </p>

                    {ubicacion && (
                      <p className="text-sm text-gray-700 font-mono">
                        📍 {ubicacion.lat.toFixed(5)}, {ubicacion.lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Método de pago mejorado */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-purple-500 mr-2">💳</span>
                  Método de pago
                </h3>
                <label className="flex items-center space-x-3 text-gray-700 bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={metodoPago === "transfer"}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-lg">💳</span>
                  <span className="font-medium">Transferencia bancaria</span>
                </label>
              </div>

              {/* Resumen mejorado */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-green-500 mr-2">📋</span>
                  Resumen del pedido
                </h3>
                <div className="space-y-3">
                  {carritoData.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
                      <span className="font-medium text-gray-800">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                          {item.cantidad}
                        </span>
                        {item.nombre} x {item.cantidad}
                      </span>
                      <span className="font-bold text-green-600">${(item.precio * item.cantidad)}</span>
                    </div>
                  ))}
                  <div className="border-t-2 border-green-200 pt-3 flex justify-between items-center bg-white rounded-lg p-3 shadow-md">
                    <span className="  text-gray-900">Comisión de la app:</span>
                    <span className="text-lg font-bold text-green-600">${carritoData.comision}</span>
                  </div>
                  <div className="border-t-2 border-green-200 pt-3 flex justify-between items-center bg-white rounded-lg p-3 shadow-md">
                    <span className="text-gray-900">Pago reparto:</span>
                    <span className="text-lg font-bold text-green-600">${carritoData.precio_reparto}</span>
                  </div>
                  <div className="border-t-2 border-green-200 pt-3 flex justify-between items-center bg-white rounded-lg p-3 shadow-md">
                    <span className="text-xl font-bold text-gray-900">Total a pagar:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${carritoData.total}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones mejorados */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 py-4 rounded-xl font-medium text-gray-700 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando || !direccion.trim() || !ubicacion}
                  className={`flex-1 py-4 rounded-xl font-medium transition-all duration-200 ${procesando || !direccion.trim() || !ubicacion
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                    }`}
                >
                  {procesando ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creando pedido...
                    </span>
                  ) : (
                    "Crear Pedido"  // <- CAMBIÓ DE "Confirmar y Pagar" A "Crear Pedido"
                  )}
                </button>
              </div>

            </form>
            {/* Modal de Comprobante de Pago */}
            <PaymentReceiptModal
              isOpen={showReceiptModal}
              onClose={handleCloseReceiptModal}
              onUploadReceipt={handleUploadReceipt}
              pedidoData={pedidoCreado}
              procesando={false}
            />
          </div>
        </div>

        {/* Notificación de Éxito */}
        {showSuccessMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-opacity">
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl max-w-sm w-full transform scale-100 transition-transform">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 text-center mb-2">¡Pedido Exitoso!</h2>
              <p className="text-gray-600 text-center font-medium mb-6">
                Tu pedido y comprobante han sido enviados correctamente.
              </p>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{
                    animation: 'progress 2.5s ease-in-out forwards'
                  }}
                ></div>
              </div>
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes progress {
                  0% { width: 0%; }
                  100% { width: 100%; }
                }
              `}} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}