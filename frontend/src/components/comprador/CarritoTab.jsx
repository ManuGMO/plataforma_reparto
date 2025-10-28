import { useState, useEffect } from "react";
import axios from "axios";
import CheckoutModal from "./PaymentModal";

export default function CarritoTab({ setNotification }) {
  const [carritoData, setCarritoData] = useState({
    items: [],
    subtotal: 0,
    comision: 0,
    precio_reparto: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [procesandoPedido, setProcesandoPedido] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  // ID del comprador (actualmente hardcodeado)
  const ID_COMPRADOR = 2;

  // Función para calcular totales
  const calcularTotales = (items) => {
    const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

    // Comisión 5% del subtotal
    const comision = Math.round(subtotal * 0.05);
    // Pago reparto 10% del subtotal
    const precio_reparto = Math.round(subtotal * 0.10);
    // Total neto
    const total = Math.round(subtotal + comision + precio_reparto);

    return { subtotal, comision, precio_reparto, total };
  };

  // Cargar carrito
  const cargarCarrito = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/carrito/comprador/${ID_COMPRADOR}`);
      console.log("Carrito", response.data);
      
      // Calcular totales correctos en el frontend
      const { subtotal, comision, precio_reparto, total } = calcularTotales(response.data.items);

      setCarritoData({
        ...response.data,
        subtotal: subtotal,
        comision: comision,
        precio_reparto: precio_reparto,
        total: total
      });
    } catch (error) {
      console.error("Error al cargar carrito:", error);
      setNotification("Error al cargar carrito");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCarrito();
  }, []);

  const handleRemove = async (producto) => {
    try {
      await axios.delete(`http://localhost:3001/api/carrito/comprador/${ID_COMPRADOR}/producto/${producto.id}`);
      await cargarCarrito(); // Recargar carrito
      setNotification("Producto eliminado del carrito");
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      const mensaje = error.response?.data?.message || "Error al eliminar producto";
      setNotification(mensaje);
    }
  };

  const handleUpdateQuantity = async (producto, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      await handleRemove(producto);
      return;
    }

    try {
      await axios.put(`http://localhost:3001/api/carrito/comprador/${ID_COMPRADOR}/producto/${producto.id}`, {
        cantidad: nuevaCantidad
      });
      await cargarCarrito(); // Recargar carrito
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
      const mensaje = error.response?.data?.message || "Error al actualizar cantidad";
      setNotification(mensaje);
    }
  };

  // FUNCIÓN MODIFICADA: Ahora recibe el archivo del comprobante también
  const handleConfirmOrder = async ({ direccion, direccionDisplay, metodoPago, latitud, longitud, comprobante }) => {
    console.log("Creando pedido con datos:", {
      id_comprador: ID_COMPRADOR,
      direccion,
      metodoPago,
      latitud,
      longitud,
      tieneComprobante: !!comprobante
    });

    try {
      // Crear FormData para enviar archivo + datos
      const formData = new FormData();
      formData.append('id_comprador', ID_COMPRADOR);
      formData.append('direccion', direccion);
      formData.append('metodo_pago', metodoPago);
      formData.append('latitud', latitud);
      formData.append('longitud', longitud);
  // Añadir desglose de montos para que el backend lo guarde en el modelo Pedido
  formData.append('precio_bruto', carritoData.subtotal);
  formData.append('comision_servicio', carritoData.comision);
  formData.append('pago_reparto', carritoData.precio_reparto);
  formData.append('total', carritoData.total);
      
      // Agregar el comprobante si existe
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const response = await axios.post(
        'http://localhost:3001/api/pedidos/comprador/desde-carrito', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log("Pedido creado exitosamente:", response.data);
      
      setNotification("¡Pedido creado exitosamente con comprobante!");
      
      // Limpiar carrito
      setCarritoData({
        items: [],
        subtotal: 0,
        comision: 0,
        precio_reparto: 0,
        total: 0
      });
      
      return response.data;
      
    } catch (error) {
      console.error("Error al crear pedido:", error);
      console.error("Response data:", error.response?.data);
      
      let mensaje = "Error al procesar pedido";
      
      if (error.response?.data?.message) {
        mensaje = error.response.data.message;
      } else if (error.response?.data?.error) {
        mensaje = error.response.data.error;
      }
      
      setNotification(mensaje);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mi Carrito</h2>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-gray-200 rounded-lg h-24 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (carritoData.items.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mi Carrito</h2>
        <div className="text-center py-8">
          <span className="text-6xl">🛒</span>
          <p className="text-gray-600 mt-4">Tu carrito está vacío</p>
          <p className="text-sm text-gray-500 mt-2">Explora productos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Mi Carrito</h2>
      
      <div className="space-y-4 mb-6">
        {carritoData.items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="aspect-square bg-gradient-to-br flex w-24 h-24 items-center justify-center">
                <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                <p className="text-sm text-gray-600">{item.vendedor}</p>
                <p className="text-sm text-gray-500">Stock disponible: {item.stock}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-lg font-bold text-green-600">${item.precio}</span>
                  <span className="text-sm text-gray-500 whitespace-nowrap">x {item.cantidad}</span>
                  <span className="text-sm font-semibold">= ${(item.precio * item.cantidad)}</span>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                {/* Controles de cantidad */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateQuantity(item, item.cantidad - 1)}
                    className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center hover:bg-gray-500"
                    disabled={item.cantidad <= 1}
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item, item.cantidad + 1)}
                    className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500"
                    disabled={item.cantidad >= item.stock}
                  >
                    +
                  </button>
                </div>
                {/* Botón eliminar */}
                <button
                  onClick={() => handleRemove(item)}
                  className="bg-gray-100 text-red-600 hover:text-red-800 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Resumen del pedido</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal ({carritoData.items.length} productos):</span>
            <span>${carritoData.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Comision por servicio:</span>
            <span>${carritoData.comision}</span>
          </div>
          <div className="flex justify-between">
            <span>Pago reparto:</span>
            <span>${carritoData.precio_reparto}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-green-600">${carritoData.total}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setModalKey(prev => prev + 1); // Forzar recreación
          setShowCheckout(true);
        }}
        disabled={carritoData.items.length === 0}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
          carritoData.items.length === 0
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        Proceder al Pago
      </button>

      {/* Modal con key para forzar recreación */}
      {showCheckout && (
        <CheckoutModal
          key={modalKey} // Esto fuerza recreación completa del componente
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          carritoData={carritoData}
          onConfirmOrder={handleConfirmOrder}
        />
      )}
    </div>
  );
}