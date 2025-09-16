import { useState } from "react";

export default function ProductViewModal({ isOpen, onClose, producto }) {
  if (!isOpen || !producto) return null;

  console.log("Producto en ProductViewModal:", producto);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            title="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Imagen del producto */}
            <div className="space-y-4">
              <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png'; // Imagen de fallback
                    e.target.className = 'w-full h-full object-contain bg-gray-100';
                  }}
                />
              </div>
            </div>

            {/* Información del producto */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {producto.nombre}
                </h3>
                
                {/* Precio */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-green-600">
                    ${producto.precio}
                  </span>
                </div>

                {/* Stock con indicador visual */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Stock:</span>
                    <span className={`font-semibold ${
                      producto.stock <= 5 ? 'text-red-600' : 
                      producto.stock <= 10 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {producto.stock} unidades
                    </span>
                    {producto.stock <= 5 && (
                      <span className="text-red-500" title="Stock bajo">⚠️</span>
                    )}
                  </div>
                  
                  {/* Barra de stock visual */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        producto.stock <= 5 ? 'bg-red-500' : 
                        producto.stock <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((producto.stock / 50) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Categoría */}
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Categoría:</span>
                  <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {producto.Categorium ? producto.Categorium.nombre : 'Sin categoría'}
                  </span>
                </div>
      

                {/* Información adicional */}
                <div className="space-y-3 text-sm text-gray-600">
                  
                  {producto.descripcion && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700 block mb-2">Descripción:</span>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {producto.descripcion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del modal */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}