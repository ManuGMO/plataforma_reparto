export default function OrderCard({ order, onViewOrder, timeAgo }) {
  const vendorName = order.vendedor?.nombre || 
                     order.Vendedor?.[0]?.nombre || 
                     (Array.isArray(order.Vendedor) && order.Vendedor.length > 0 ? order.Vendedor[0].nombre : null) ||
                     'Restaurante';
  
  const customerName = order.comprador?.nombre || 
                       order.Comprador?.[0]?.nombre || 
                       (Array.isArray(order.Comprador) && order.Comprador.length > 0 ? order.Comprador[0].nombre : null) ||
                       'Cliente';
  
  const itemCount = order.productos?.length || 
                    order.Productos?.length || 
                    order.Producto?.length || 
                    0;

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'listo_para_recoger': return 'bg-green-100 text-green-800';
      case 'en_reparto': return 'bg-blue-100 text-blue-800';
      case 'entregado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'listo_para_recoger': return 'Listo para recoger';
      case 'en_reparto': return 'En reparto';
      case 'entregado': return 'Entregado';
      default: return estado;
    }
  };

  return (
    <div 
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewOrder && onViewOrder(order)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">Pedido #{order.id_pedido}</h3>
          <p className="text-sm text-gray-600">{timeAgo}</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(order.estado)}`}>
            {getStatusText(order.estado)}
          </span>
        </div>
        <div className="text-right">
        <p className="text-lg font-bold text-green-600">${order.total || 0}</p>
        <p className="text-sm text-gray-600">Ganancia: ${order.pago_reparto || order.precio_reparto || 0}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-sm text-gray-700 font-medium">Recoger: {vendorName}</span>
          {order.vendor_distance_to_route_meters != null && (
            <span className="ml-2 text-xs text-gray-500">· A {order.vendor_distance_to_route_meters} m de tu ruta</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span className="text-sm text-gray-700 font-medium">Entregar: {customerName}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">{itemCount} productos</span>
        <span className="text-blue-600 font-medium">Ver detalles →</span>
      </div>
    </div>
  );
}
