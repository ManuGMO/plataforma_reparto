import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

export default function PedidosModal({
  pedido,
  loadingDetalle,
  onCerrar,
  onCambiarEstado,
  getEstadoNombre,
  vendorId: propVendorId = 1
}) {
  const [mostrarComprobante, setMostrarComprobante] = useState(false);
  const [repartidoresCercanos, setRepartidoresCercanos] = useState(null);
  const [cargandoRepartidores, setCargandoRepartidores] = useState(false);
  const DEFAULT_UMBRAL = 1000; // metros

  const API_URL = import.meta.env.VITE_API_URL;

  if (!pedido) return null;

  useEffect(() => {
    if (!pedido) return;

    // Si el objeto pedido no incluye datos del vendedor, usamos el vendorId pasado desde el padre
    const vendorIdToUse = pedido?.vendedor?.id_usuario || pedido?.vendedor_id || propVendorId;
    if (!vendorIdToUse) return;

    const controller = new AbortController();

    const fetchRepartidores = async () => {
      setCargandoRepartidores(true);
      try {
        const res = await axios.get(`${API_URL}/api/repartidores/cercanos/${vendorIdToUse}/${DEFAULT_UMBRAL}`, { signal: controller.signal });
        setRepartidoresCercanos(res.data.data || []);
        console.debug('Repartidores cercanos recibidos:', (res.data && res.data.data) ? res.data.data.length : 0);
      } catch (e) {
        // axios when aborted throws a CanceledError with code 'ERR_CANCELED' (or message 'canceled').
        const isCanceled = e?.code === 'ERR_CANCELED' || e?.message === 'canceled' || e?.name === 'CanceledError' || e?.name === 'AbortError';
        if (!isCanceled) console.error('Error cargando repartidores cercanos', e);
      } finally {
        setCargandoRepartidores(false);
      }
    };

    fetchRepartidores();
    return () => controller.abort();
  }, [pedido, propVendorId]);


  const calcularTiempoTranscurrido = (fecha1, fecha2) => {
    const diff = Math.abs(new Date(fecha2) - new Date(fecha1));
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `${dias} día(s)`;
    if (horas > 0) return `${horas} hora(s)`;
    return `${minutos} minuto(s)`;
  };


  return (
    <>
      {/* Modal de Detalles Mejorado */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">

          {/* Header del Modal */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Pedido #{pedido.id_pedido}
                </h3>
                <p className="text-sm opacity-90">
                  {new Date(pedido.fecha_creacion).toLocaleString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={onCerrar}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20`}>
                {getEstadoNombre(pedido.estado)}
              </span>

              {pedido.comprobante_pago && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${pedido.pago_confirmado
                  ? 'bg-green-500 bg-opacity-70'
                  : 'bg-orange-500 bg-opacity-30'
                  }`}>
                  {pedido.pago_confirmado ? '✔ Pago confirmado' : '⏳ Pago en revisión'}
                </span>
              )}
            </div>
          </div>

          {/* Contenido del Modal */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {loadingDetalle ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Cargando detalles...</span>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">

                {/* Columna Izquierda: Info del Cliente */}
                <div className="space-y-6">

                  {/* Info del Cliente */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">👤</span>
                      Información del Cliente
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-600 w-20">Nombre:</span>
                        <span className="font-medium text-gray-500">{pedido.comprador?.nombre || 'N/A'}</span>
                      </div>
                      {pedido.comprador?.email && (
                        <div className="flex items-center">
                          <span className="text-gray-600 w-20">Email:</span>
                          <span className="font-medium">{pedido.comprador.email}</span>
                        </div>
                      )}
                      {pedido.comprador?.telefono && (
                        <div className="flex items-center">
                          <span className="text-gray-600 w-20">Teléfono:</span>
                          <span className="font-medium">{pedido.comprador.telefono}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">📍</span>
                      Dirección de Entrega
                    </h4>
                    <p className="text-sm text-gray-700">
                      {pedido.direccion || 'No especificada'}
                    </p>
                  </div>

                  {/* Repartidor: se muestra en la columna derecha para evitar duplicados */}

                  {/* Productos */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">🛍️</span>
                      Productos ({pedido.productos?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {pedido.productos?.map((producto, i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                          <div>
                            <span className="font-medium text-gray-600">{producto.nombre}</span>
                            {producto.eliminado && (
                              <span className="text-red-500 text-xs ml-1">(Producto eliminado)</span>
                            )}
                            <div className="text-gray-600 text-xs">
                              ${producto.precio_unitario} x {producto.cantidad}
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900">
                            ${producto.subtotal}
                          </span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold text-lg text-gray-700">
                        <span>Total:</span>
                        <span className="text-green-600">${pedido.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Comprobante de Pago */}
                <div className="space-y-6">
                  {/* Panel derecho: mostrar repartidor asignado si existe, sino repartidores cercanos */}
                  {(pedido.tiene_repartidor || (pedido.repartidor && pedido.repartidor.id)) ? (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">🚚</span>
                        Repartidor asignado
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{pedido.repartidor?.nombre || 'Repartidor'}</div>
                          <div className="text-xs text-gray-500">{pedido.repartidor?.telefono || 'Sin teléfono'}</div>
                          {pedido.repartidor?.email && (
                            <div className="text-xs text-gray-500">{pedido.repartidor.email}</div>
                          )}
                        </div>
                        {pedido.repartidor?.distancia_m && (
                          <div className="text-sm font-semibold text-gray-900">{pedido.repartidor.distancia_m} m</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">🚚</span>
                        Repartidores cercanos
                      </h4>
                      <div>
                        {cargandoRepartidores ? (
                          <div className="text-sm text-gray-600">Buscando repartidores...</div>
                        ) : repartidoresCercanos ? (
                          repartidoresCercanos.length === 0 ? (
                            <div className="text-sm text-gray-600">No hay repartidores dentro de 1 km.</div>
                          ) : (
                            <ul className="space-y-2">
                              {repartidoresCercanos.map(r => (
                                <li key={r.id_usuario} className="p-2 bg-white rounded shadow-sm flex justify-between items-center">
                                  <div>
                                    <div className="font-medium text-sm text-gray-900">{r.nombre}</div>
                                    <div className="text-xs text-gray-500">{r.telefono || 'Sin teléfono'}</div>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900">{r.distancia_m} m</div>
                                </li>
                              ))}
                            </ul>
                          )
                        ) : (
                          <div className="text-sm text-gray-500">Buscando repartidores...</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estado de Pago */}
                  <div className={`rounded-lg p-4 ${pedido.pago_confirmado
                    ? 'bg-green-50 border border-green-200'
                    : pedido.comprobante_pago
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-gray-50 border border-gray-200'
                    }`}>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">💳</span>
                      Estado del Pago
                    </h4>

                    {pedido.comprobante_pago ? (
                      <div className="space-y-3">
                        {pedido.pago_confirmado ? (
                          <div className="flex items-center text-green-700">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Pago confirmado por administrador</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-orange-700">
                            <svg className="w-5 h-5 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Esperando confirmación del administrador</span>
                          </div>
                        )}

                        {pedido.fecha_confirmacion_pago && (
                          <p className="text-xs text-gray-600">
                            Confirmado el: {new Date(pedido.fecha_confirmacion_pago).toLocaleString('es-CL')}
                          </p>
                        )}

                        {/* Botón para ver comprobante */}
                        <button
                          onClick={() => setMostrarComprobante(true)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Comprobante de Pago
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          El cliente aún no ha subido el comprobante de pago
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timeline del pedido */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📅</span>
                      Historial del Pedido
                    </h4>

                    <div className="relative">
                      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-300"></div>

                      <div className="space-y-4 relative">

                        {/* Pedido creado */}
                        <div className="flex items-start">
                          <div className="w-4 h-4 rounded-full bg-blue-500 mt-1 z-10"></div>
                          <div className="ml-4">
                            <p className="font-medium text-sm text-gray-900">Pedido creado</p>
                            <p className="text-xs text-gray-500">
                              {new Date(pedido.fecha_creacion).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Estado anterior (si existe) */}
                        {pedido.estado_anterior && pedido.estado !== 'pendiente' && (
                          <div className="flex items-start">
                            <div className="w-4 h-4 rounded-full bg-gray-400 mt-1 z-10"></div>
                            <div className="ml-4">
                              <p className="font-medium text-sm text-gray-700">
                                {getEstadoNombre(pedido.estado_anterior)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {pedido.fecha_estado_anterior_guardada ?
                                  new Date(pedido.fecha_estado_anterior_guardada).toLocaleTimeString('es-CL', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  }) :
                                  'hora no disponible'
                                }
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Estado actual */}
                        {pedido.estado !== 'pendiente' && (
                          <div className="flex items-start">
                            <div className={`w-4 h-4 rounded-full mt-1 z-10 ${pedido.estado === 'entregado' ? 'bg-green-500' :
                              pedido.estado === 'rechazado' ? 'bg-red-500' :
                                pedido.estado === 'cancelado' ? 'bg-gray-500' :
                                  pedido.estado === 'en_reparto' ? 'bg-indigo-500' :
                                    pedido.estado === 'listo_para_recoger' ? 'bg-purple-500' :
                                      'bg-blue-500'
                              }`}></div>
                            <div className="ml-4">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-gray-900">
                                  {getEstadoNombre(pedido.estado)}
                                </p>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                  Actual
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {pedido.fecha_ultimo_cambio_estado ?
                                  new Date(pedido.fecha_ultimo_cambio_estado).toLocaleTimeString('es-CL', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  }) :
                                  new Date(pedido.fecha_creacion).toLocaleTimeString('es-CL', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                }
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Pedido */}
                  <div className="bg-white rounded-lg p-4 border">


                    <h4 className="font-semibold text-gray-900 mb-3">Acciones</h4>

                    <div className="space-y-2">
                      {pedido.estado === "pendiente" && (
                        <>
                          <button onClick={() => { onCambiarEstado(pedido.id_pedido, "aceptado", "Pedido aceptado. Comenzando preparación.") }}
                            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Aceptar Pedido
                          </button>
                          <button onClick={() => { onCambiarEstado(pedido.id_pedido, "rechazado", "Pedido rechazado. Cliente notificado.") }}
                            className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                          >
                            Rechazar Pedido
                          </button>
                        </>
                      )}

                      {pedido.estado === "aceptado" && (
                        <button onClick={() => { onCambiarEstado(pedido.id_pedido, "listo_para_recoger", "Pedido listo. Repartidor notificado.") }}
                          className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          Marcar como Listo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer del Modal */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
            <button
              onClick={onCerrar}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para ver comprobante en grande */}
      {mostrarComprobante && pedido.comprobante_pago && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Comprobante de Pago - Pedido #{pedido.id_pedido}
              </h3>
              <button
                onClick={() => setMostrarComprobante(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              <div className="text-center">
                <img
                  src={`${API_URL}/${pedido.comprobante_pago}`}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Error+cargando+imagen';
                  }}
                />
              </div>

              {pedido.pago_confirmado ? (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-medium">
                    Este pago ya fue confirmado por el administrador
                  </p>
                  {pedido.fecha_confirmacion_pago && (
                    <p className="text-sm text-green-600 mt-1">
                      Confirmado el: {new Date(pedido.fecha_confirmacion_pago).toLocaleString('es-CL')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <p className="text-orange-700 font-medium">
                    Este comprobante está esperando confirmación del administrador
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setMostrarComprobante(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}