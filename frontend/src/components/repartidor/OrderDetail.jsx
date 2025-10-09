import { useState, useEffect } from "react";

export default function OrderDetail({ order, onBack, onAccept }) {
  const [vendorAddress, setVendorAddress] = useState();

  if (!order) return null;

  console.log("OrderDetail received order:", order);

  const vendorName = order.vendedor.nombre ;
  //const vendorAddress = "Av. Principal 123"; // Esto debería venir de la base de datos
  const customerName = order.comprador.nombre;
  const customerAddress = order.direccion || 'Dirección no especificada';
  
  useEffect(() => {
    if (order.vendedor.latitud && order.vendedor.longitud) {
      const fetchAddress = async () => {
        try {
          const token = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA'; // pon tu token aquí
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${order.vendedor.longitud},${order.vendedor.latitud}.json?access_token=${token}&limit=1`;

          const res = await fetch(url);
          const data = await res.json();

          console.log("Mapbox Geocoding response:", data);

          if (data.features && data.features.length > 0) {
            setVendorAddress(data.features[0].place_name);
          } else {
            setVendorAddress("Dirección no encontrada");
          }
        } catch (error) {
          console.error("Error al obtener dirección de Mapbox:", error);
          setVendorAddress("Error cargando dirección");
        }
      };

      fetchAddress();
    }
  }, [order.comprador.latitud, order.comprador.longitud]);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffMinutes = Math.floor((now - orderDate) / (1000 * 60));
    
    if (diffMinutes < 1) return "Hace unos segundos";
    if (diffMinutes === 1) return "Hace 1 minuto";
    if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "Hace 1 hora";
    return `Hace ${diffHours} horas`;
  };

  const calculateDistance = () => {
    // Simular cálculo de distancia basado en coordenadas
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-3 flex items-center">
          <button onClick={onBack} className="mr-3 text-2xl">←</button>
          <h1 className="text-lg font-bold text-gray-900">Detalle del Pedido</h1>
        </div>
      </header>
      
      <div className="p-4 space-y-6">
        {/* Order Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pedido #{order.id_pedido}</h2>
              <p className="text-sm text-gray-600">{formatTimeAgo(order.fecha_creacion)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{'$' + (order.total || 0)}</p>
              <p className="text-sm text-gray-600">{'Ganancia: $' + (order.pago_reparto || order.precio_reparto || 0)}</p>
              <p className="text-sm text-gray-600">{calculateDistance()} km</p>
            </div>
          </div>
        </div>
        
        {/* Route */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Recoger en:</p>
              <p className="text-gray-600">{vendorName}</p>
              <p className="text-sm text-gray-500">{vendorAddress}</p>
            </div>
          </div>
          
          <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-8"></div>
          
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-green-600 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Entregar en:</p>
              <p className="text-gray-600">{customerName}</p>
              <p className="text-sm text-gray-500">{customerAddress}</p>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Productos del pedido</h3>
          <div className="space-y-2">
            {order.productos && order.productos.length > 0 ? (
              order.productos.map((producto, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-sm text-gray-600">Cantidad: {producto.Producto_Pedido?.cantidad || 1}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{'$' + (producto.precio || 0)}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No hay información detallada de productos</p>
            )}
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Desglose</h3>
          <div className="space-y-2 text-sm text-gray-800">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{'$' + (order.precio_bruto || order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-700 ">
              <span>Comisión servicio</span>
              <span>{'$' + (order.comision_servicio || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ganancia del repartidor</span>
              <span>{'$' + (order.pago_reparto || order.precio_reparto || 0)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{'$' + (order.total || 0)}</span>
            </div>
          </div>
        </div>
        
        
        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <button 
            onClick={() => onAccept(order.id_pedido)}
            className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            ✅ Aceptar Pedido
          </button>
          <button 
            onClick={onBack}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    </div>
  );
}