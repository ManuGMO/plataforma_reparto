import { useState, useEffect } from "react";
import { Search, X, Plus, Minus, Star, MapPin, User, Package } from "lucide-react";

function Categories({ activeCategory, setActiveCategory, categorias }) {
  // mostrar categorias
  const categoriasAMostrar = categorias.length > 0 ? [
    { id: 'all', name: 'Todos', emoji: '' },
    ...categorias.map(cat => ({
      id: cat.nombre.toLowerCase(),
      name: cat.nombre
    }))
  ] : [];

  return (
    <div className="bg-white border-b">
      <div className="w-full px-4 py-3">
        <div className="flex space-x-4 overflow-x-auto">
          {categoriasAMostrar.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                activeCategory === category.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {category.emoji} {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ProductModal({ producto, isOpen, onClose, onAddToCart }) {
  const [cantidad, setCantidad] = useState(1);

  if (!isOpen || !producto) return null;

  const handleAddToCart = () => {
    onAddToCart(producto, cantidad);
    onClose();
    setCantidad(1);
  };

  const incrementCantidad = () => {
    if (cantidad < producto.stock) {
      setCantidad(cantidad + 1);
    }
  };

  const decrementCantidad = () => {
    if (cantidad > 1) {
      setCantidad(cantidad - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200">
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className="w-full h-full object-cover rounded-t-xl"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{producto.nombre}</h2>
          
          {/* Vendor Info */}
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{producto.vendedor}</span>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-2 text-gray-600 mb-4">
            <MapPin className="h-4 w-4" />
            <span className="text-sm" title={producto.ubicacion}>
              {producto.ubicacion}
            </span>
          </div>

          {/* Category */}
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4 capitalize">
            {producto.categoria}
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-green-600 mb-4">
            ${producto.precio}
          </div>

          {/* Stock */}
          <div className="flex items-center space-x-2 text-gray-600 mb-6">
            <Package className="h-4 w-4" />
            <span className="text-sm">Stock disponible: {producto.stock} unidades</span>
          </div>

          {/* Description */} 
          {producto.descripcion && (
            <div className="mt-4">
              <span className="font-medium text-gray-700 block mb-2">Descripción:</span>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {producto.descripcion}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <div className="flex items-center text-gray-700 space-x-3">
              <button
                onClick={decrementCantidad}
                disabled={cantidad <= 1}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-semibold min-w-[2rem] text-center">{cantidad}</span>
              <button
                onClick={incrementCantidad}
                disabled={cantidad >= producto.stock}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                ${(producto.precio * cantidad)}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={producto.stock === 0}
            className={`w-full py-3 rounded-lg text-lg font-medium transition-colors ${
              producto.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {producto.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductosTabComprador({ setNotification, CompradorID }) {
  const [productos, setProductos] = useState([]);
  const [productosConDireccion, setProductosConDireccion] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ID del comprador (actualmente hardcodeado)
  const ID_COMPRADOR = CompradorID;

  // Token de Mapbox - REEMPLAZA CON TU TOKEN REAL
  const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFudWdtbyIsImEiOiJjbWZocHBobnkwZTFzMmpteTBqejdjM2NyIn0.szPCGrt15ZmioZVcXyGycA';

  // Función para convertir coordenadas a dirección usando Mapbox
  const geocodeReverse = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place&language=es&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Error en geocoding');
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        // Obtener una dirección más limpia
        const placeName = place.place_name || place.text || 'Dirección no disponible';
        // Si es muy largo, intentar usar solo el contexto más relevante
        const shortAddress = placeName.split(',').slice(0, 2).join(',') || placeName;
        return shortAddress;
      }
      
      return 'Dirección no encontrada';
    } catch (error) {
      console.error('Error en geocoding:', error);
      return 'Dirección no disponible';
    }
  };

  // Procesar direcciones de productos
  const procesarDirecciones = async (productosOriginales) => {
    if (!productosOriginales || productosOriginales.length === 0) {
      return [];
    }

    setLoadingAddresses(true);

    try {
      const productosConDireccionPromises = productosOriginales.map(async (producto) => {
        // Si ya tiene una ubicación hardcodeada y no tiene coordenadas, mantener la ubicación
        if (producto.ubicacion && (!producto.latitud || !producto.longitud)) {
          return producto;
        }
        
        // Si tiene coordenadas válidas, convertir a dirección
        if (producto.latitud && producto.longitud && 
            !isNaN(producto.latitud) && !isNaN(producto.longitud) &&
            MAPBOX_TOKEN && MAPBOX_TOKEN !== 'TU_MAPBOX_ACCESS_TOKEN') {
          
          const direccion = await geocodeReverse(producto.latitud, producto.longitud);
          return {
            ...producto,
            ubicacion: direccion
          };
        }
        
        // Si no tiene ni ubicación ni coordenadas válidas
        return {
          ...producto,
          ubicacion: producto.ubicacion || 'Ubicación no disponible'
        };
      });

      const productosResueltos = await Promise.all(productosConDireccionPromises);
      return productosResueltos;
    } catch (error) {
      console.error('Error procesando direcciones:', error);
      // En caso de error, devolver productos con ubicaciones originales
      return productosOriginales.map(producto => ({
        ...producto,
        ubicacion: producto.ubicacion || 'Ubicación no disponible'
      }));
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Cargar productos
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3001/api/productos/comprador");
        const data = await response.json();
        setProductos(data);

        console.log('Productos cargados:', data);

        // Procesar direcciones
        const productosConDir = await procesarDirecciones(data);
        setProductosConDireccion(productosConDir);

        // Extraer categorías únicas de los productos
        const categoriasUnicas = [...new Set(data.map(p => p.categoria))];
        setCategorias(categoriasUnicas.map(nombre => ({ nombre })));
        
        setError(null);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError("Error al cargar productos");
        setNotification("Error al cargar productos");
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, [setNotification]);

  // Filtrar productos por categoría y término de búsqueda
  const productosFiltrados = productosConDireccion.filter(producto => {
    const matchesCategory = activeCategory === 'all' || producto.categoria === activeCategory;
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (producto, cantidad = 1) => {
    try {
      const response = await fetch(`http://localhost:3001/api/carrito/comprador/${ID_COMPRADOR}/agregar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_producto: producto.id,
          cantidad: cantidad
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al agregar producto');
      }
      
      setNotification(`${cantidad} ${producto.nombre}${cantidad > 1 ? 's' : ''} agregado${cantidad > 1 ? 's' : ''} al carrito`);
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      setNotification(error.message || "Error al agregar producto");
    }
  };

  const openProductModal = (producto) => {
    setSelectedProduct(producto);
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="p-4 h-full">
        <div className="bg-white border-b">
          <div className="w-full px-4 py-3">
            <div className="flex space-x-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-shrink-0 px-4 py-2 bg-gray-200 rounded-full animate-pulse h-8 w-20"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white border-b px-4 py-3">
          <div className="bg-gray-200 rounded-lg h-10 animate-pulse"></div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <span className="text-6xl">😞</span>
          <p className="text-gray-600 mt-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="p-4">
        <Categories activeCategory={activeCategory} setActiveCategory={setActiveCategory} categorias={categorias} />
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="text-center py-8">
          <span className="text-6xl">🍽️</span>
          <p className="text-gray-600 mt-4">No hay productos disponibles</p>
          <p className="text-sm text-gray-500 mt-2">Los vendedores aún no han agregado productos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Categories 
        activeCategory={activeCategory} 
        setActiveCategory={setActiveCategory} 
        categorias={categorias}
      />
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <div className="flex-1 overflow-y-auto p-4">
        {loadingAddresses && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">Cargando direcciones...</span>
            </div>
          </div>
        )}
        
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-6xl">🔍</span>
            <p className="text-gray-600 mt-4">
              {searchTerm 
                ? `No se encontraron productos con "${searchTerm}"`
                : "No hay productos en esta categoría"
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {productosFiltrados.map(producto => (
              <div 
                key={producto.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openProductModal(producto)}
              >
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{producto.nombre}</h3>
                  <p className="text-xs text-gray-600 mb-1">{producto.vendedor}</p>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1" title={producto.ubicacion}>
                    📍 {producto.ubicacion}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-green-600">${producto.precio}</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Stock: {producto.stock}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(producto);
                    }}
                    disabled={producto.stock === 0}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      producto.stock === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {producto.stock === 0 ? 'Sin Stock' : 'Agregar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductModal
        producto={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeProductModal}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}