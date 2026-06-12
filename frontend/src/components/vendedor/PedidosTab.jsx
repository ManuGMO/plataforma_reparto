import { useEffect, useState } from "react";
import axios from "axios";
import PedidosModal from "./PedidosModal";

export default function PedidosTab({ setNotification, vendorId }) {
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    cargarPedidos();
  }, [setNotification]);

  const cargarPedidos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pedidos/vendedor/${vendorId}`);
      // Filtrar pedidos entregados para que se vayan eliminando de la vista
      const visibles = (res.data || []).filter(p => p.estado !== 'entregado');
      // Ordenar del más nuevo al más viejo por fecha_creacion
      visibles.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
      setPedidos(visibles);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    }
  };

  // Cargar detalles completos del pedido
  const cargarDetallePedido = async (id_pedido) => {
    try {
      setLoadingDetalle(true);
      const res = await axios.get(`${API_URL}/api/pedidos/detalle/${id_pedido}?vendedorId=${vendorId}`);

      const estadoKey = `pedido_${id_pedido}_fecha_estado`;
      const fechaGuardada = localStorage.getItem(estadoKey);

      if (!fechaGuardada && res.data.fecha_ultimo_cambio_estado) {
        localStorage.setItem(estadoKey, res.data.fecha_ultimo_cambio_estado);
      }

      setPedidoSeleccionado({
        ...res.data,
        fecha_estado_anterior_guardada: fechaGuardada
      });

    } catch (error) {
      console.error("Error cargando detalle:", error);
      setNotification("Error al cargar detalles del pedido");
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cambiarEstado = async (id_pedido, nuevoEstado, mensaje) => {
    try {

      await axios.patch(`${API_URL}/api/pedidos/${id_pedido}/estado`, {
        estado: nuevoEstado,
        id_vendedor: vendorId
      });

      setNotification(mensaje);
      // Si el pedido quedó como entregado, eliminarlo inmediatamente de la lista local
      if (nuevoEstado === 'entregado') {
        setPedidos(prev => prev.filter(p => p.id_pedido !== id_pedido));
        // cerrar modal si está abierto para ese pedido
        if (pedidoSeleccionado?.id_pedido === id_pedido) {
          setPedidoSeleccionado(null);
        }
      } else {
        // para otros cambios, recargar la lista
        cargarPedidos();
      }
      // Actualizar detalle si está abierto
      if (pedidoSeleccionado?.id_pedido === id_pedido) {
        await cargarDetallePedido(id_pedido);
      }
    } catch (error) {
      console.error("Error cambiando estado:", error);
      setNotification("Error al cambiar el estado del pedido");
    }
  };

  const getEstadoStyle = (estado) => {
    const styles = {
      'pendiente': "bg-yellow-100 text-yellow-800",
      'aceptado': "bg-blue-100 text-blue-800",
      'listo_para_recoger': "bg-purple-100 text-purple-800",
      'en_reparto': "bg-green-100 text-green-800",
      'entregado': "bg-emerald-100 text-emerald-800",
      'rechazado': "bg-red-100 text-red-800",
      'cancelado': "bg-gray-100 text-gray-800"
    };
    return styles[estado] || "bg-gray-100 text-gray-800";
  };

  const getEstadoNombre = (estado) => {
    const nombres = {
      'pendiente': 'Pendiente',
      'aceptado': 'En Preparación',
      'listo_para_recoger': 'Listo para Recoger',
      'en_reparto': 'En Reparto',
      'entregado': 'Entregado',
      'rechazado': 'Rechazado',
      'cancelado': 'Cancelado'
    };
    return nombres[estado] || estado;
  };

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : pedidos.filter(pedido => pedido.estado === filtroEstado);

  const contarPedidosPorEstado = (estado) => {
    return pedidos.filter(pedido => pedido.estado === estado).length;
  };

  const cerrarModal = () => {
    setPedidoSeleccionado(null);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Gestión de Pedidos</h2>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {pedidos.length} pedidos totales
        </div>
      </div>

      {/* Sistema de Filtros */}
      <div className="mb-6 bg-white rounded-lg border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Filtrar por estado:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroEstado === 'todos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Todos ({pedidos.length})
          </button>

          <button
            onClick={() => setFiltroEstado('pendiente')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroEstado === 'pendiente'
              ? 'bg-yellow-600 text-white'
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              }`}
          >
            Pendientes ({contarPedidosPorEstado('pendiente')})
          </button>

          <button
            onClick={() => setFiltroEstado('aceptado')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroEstado === 'aceptado'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
          >
            En Preparación ({contarPedidosPorEstado('aceptado')})
          </button>

          <button
            onClick={() => setFiltroEstado('listo_para_recoger')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroEstado === 'listo_para_recoger'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              }`}
          >
            Listos ({contarPedidosPorEstado('listo_para_recoger')})
          </button>

          <button
            onClick={() => setFiltroEstado('en_reparto')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroEstado === 'en_reparto'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
          >
            En Reparto ({contarPedidosPorEstado('en_reparto')})
          </button>

          <button
            onClick={() => setFiltroEstado('entregado')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filtroEstado === 'entregado'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
          >
            Entregados ({contarPedidosPorEstado('entregado')})
          </button>
        </div>
      </div>

      {/* Lista de pedidos filtrados */}
      <div className="space-y-4">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-lg font-medium">
              {filtroEstado === 'todos'
                ? 'No tienes pedidos'
                : `No hay pedidos ${getEstadoNombre(filtroEstado).toLowerCase()}`
              }
            </p>
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id_pedido}
              onClick={() => cargarDetallePedido(pedido.id_pedido)}
              className="order-card bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Pedido #{pedido.id_pedido}
                  </h3>
                  <p className="text-sm text-gray-600">Cliente: {pedido.cliente}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(pedido.fecha_creacion).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoStyle(pedido.estado)}`}>
                    {getEstadoNombre(pedido.estado)}
                  </span>

                  {/* Indicador de comprobante */}
                  {pedido.comprobante_pago && (
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${pedido.pago_confirmado
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                      }`}>
                      {pedido.pago_confirmado ? '✔ Pago confirmado' : '⏳ Pago pendiente'}
                    </div>
                  )}

                  {pedido.tiene_repartidor && (
                    <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      🚚 Repartidor asignado
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {pedido.items.slice(0, 2).map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-gray-500"
                  >
                    <span>
                      {item.cantidad}x {item.nombre}
                      {item.producto_eliminado && (
                        <span className="text-red-500 text-xs ml-1">(Eliminado)</span>
                      )}
                    </span>
                    <span>${item.precio_unitario * item.cantidad}</span>
                  </div>
                ))}
                {pedido.items.length > 2 && (
                  <p className="text-xs text-gray-400">+{pedido.items.length - 2} productos más...</p>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-gray-700">
                  <span>Total:</span>
                  <span className="text-green-600">${pedido.total}</span>
                </div>
              </div>

              <div className="text-center text-xs text-blue-600">
                Click para ver detalles completos →
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalles */}
      {pedidoSeleccionado && (
        <PedidosModal
          pedido={pedidoSeleccionado}
          loadingDetalle={loadingDetalle}
          onCerrar={cerrarModal}
          onCambiarEstado={cambiarEstado}
          getEstadoNombre={getEstadoNombre}
          vendorId={vendorId}
        />
      )}
    </div>
  );
}