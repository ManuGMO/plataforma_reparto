import { useEffect, useState } from "react";
import axios from "axios";

export default function PedidosTab({ setNotification }) {
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 🔥 Nuevo estado para filtro

  useEffect(() => {
    cargarPedidos();
  }, [setNotification]);

  const cargarPedidos = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/pedidos/vendedor/1");
      setPedidos(res.data);
      console.log("AAAAA: ", res.data);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    }
  };

  const cambiarEstado = async (id_pedido, nuevoEstado, mensaje) => {
    try {
      await axios.patch(`http://localhost:3001/api/pedidos/${id_pedido}/estado`, {
        estado: nuevoEstado,
        id_vendedor: 1 
      });
      setNotification(mensaje);
      cargarPedidos(); // refresca lista
    } catch (error) {
      console.error("Error cambiando estado:", error);
      setNotification("Error al cambiar el estado del pedido");
    }
  };

  // 🔥 Función para obtener el estilo del estado
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

  // 🔥 Función para obtener el nombre legible del estado
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

  // 🔥 Filtrar pedidos según el estado seleccionado
  const pedidosFiltrados = filtroEstado === 'todos' 
    ? pedidos 
    : pedidos.filter(pedido => pedido.estado === filtroEstado);

  // 🔥 Contar pedidos por estado
  const contarPedidosPorEstado = (estado) => {
    return pedidos.filter(pedido => pedido.estado === estado).length;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Gestión de Pedidos</h2>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {pedidos.length} pedidos totales
        </div>
      </div>

      {/* 🔥 Sistema de Filtros */}
      <div className="mb-6 bg-white rounded-lg border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Filtrar por estado:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === 'todos' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({pedidos.length})
          </button>
          
          <button
            onClick={() => setFiltroEstado('pendiente')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === 'pendiente' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            Pendientes ({contarPedidosPorEstado('pendiente')})
          </button>
          
          <button
            onClick={() => setFiltroEstado('aceptado')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === 'aceptado' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            En Preparación ({contarPedidosPorEstado('aceptado')})
          </button>
          
          <button
            onClick={() => setFiltroEstado('listo_para_recoger')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === 'listo_para_recoger' 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
          >
            Listos ({contarPedidosPorEstado('listo_para_recoger')})
          </button>
          
          <button
            onClick={() => setFiltroEstado('en_reparto')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === 'en_reparto' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            En Reparto ({contarPedidosPorEstado('en_reparto')})
          </button>
          
          <button
            onClick={() => setFiltroEstado('entregado')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === 'entregado' 
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
            <p className="text-sm">
              {filtroEstado !== 'todos' && 'Prueba con otro filtro o'}
            </p>
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id_pedido}
              className="order-card bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoStyle(pedido.estado)}`}>
                  {getEstadoNombre(pedido.estado)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {pedido.items.map((item, i) => (
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
                    <span>${item.precio_unitario}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">${pedido.total}</span>
                </div>
              </div>

              {/* 🔥 Botones dinámicos según estado actualizado */}
              <div className="flex space-x-2">
                {pedido.estado === "pendiente" ? (
                  <>
                    <button
                      onClick={() =>
                        cambiarEstado(
                          pedido.id_pedido,
                          "aceptado",
                          "Pedido aceptado. Comenzando preparación."
                        )
                      }
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() =>
                        cambiarEstado(
                          pedido.id_pedido,
                          "rechazado",
                          "Pedido rechazado. Cliente notificado."
                        )
                      }
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Rechazar
                    </button>
                  </>
                ) : pedido.estado === "aceptado" ? (
                  <button
                    onClick={() =>
                      cambiarEstado(
                        pedido.id_pedido,
                        "listo_para_recoger",
                        "Pedido listo para recoger. Repartidor notificado."
                      )
                    }
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    🍽️ Marcar como Listo
                  </button>
                ) : pedido.estado === "listo_para_recoger" ? (
                  <button
                    disabled
                    className="flex-1 bg-gray-400 text-white py-2 rounded-lg text-sm font-medium cursor-not-allowed"
                  >
                    ⏳ Esperando repartidor
                  </button>
                ) : pedido.estado === "en_reparto" ? (
                  <div className="flex-1 text-center py-2">
                    <p className="text-sm font-medium text-green-600">
                      En camino al cliente
                    </p>
                  </div>
                ) : pedido.estado === "entregado" ? (
                  <div className="flex-1 text-center py-2">
                    <p className="text-sm font-medium text-emerald-600">
                    Pedido Entregado
                    </p>
                  </div>
                ) : pedido.estado === "rechazado" ? (
                  <div className="flex-1 text-center py-2">
                    <p className="text-sm font-medium text-red-600">
                    Pedido Rechazado
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalles */}
      {pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Detalles del Pedido #{pedidoSeleccionado.id_pedido}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Cliente: {pedidoSeleccionado.cliente}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {new Date(pedidoSeleccionado.fecha_creacion).toLocaleString()}
            </p>

            <div className="space-y-2">
              {pedidoSeleccionado.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm text-gray-500 border-b pb-1"
                >
                  <span>
                    {item.cantidad}x {item.nombre}
                  </span>
                  <span>${item.precio_unitario}</span>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-green-600">
                  ${pedidoSeleccionado.total}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setPedidoSeleccionado(null)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}