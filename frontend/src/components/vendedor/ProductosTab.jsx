import { useEffect, useState } from "react";
import axios from "axios";
import EditProductModal from "./EditarModal"; // Modal de edición
import ProductViewModal from "./ProductViewModal"; // Nuevo modal de vista

export default function ProductosTab({ openModal, refreshTrigger }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  
  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);

  // Estados para el modal de vista
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [productoAVer, setProductoAVer] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/productos/obtener/1");
        setProductos(res.data.productos);
        setCategorias(res.data.categorias);

        console.log("Productos: ", res.data.productos);
        console.log("Categorias: ", res.data.categorias);

      } catch (err) {
        console.error("Error cargando productos:", err);
      }
    };
    fetchProductos();
  }, [refreshTrigger]);

  // Filtrar productos por categoría
  const productosFiltrados = categoriaSeleccionada === 'todas' 
    ? productos 
    : productos.filter(p => p.id_categoria === parseInt(categoriaSeleccionada));

  // Agrupar productos por categoría para la vista por categorías
  const productosAgrupados = productos.reduce((acc, producto) => {
    const categoriaNombre = producto.Categorium ? producto.Categorium.nombre : 'Sin categoría';
    if (!acc[categoriaNombre]) {
      acc[categoriaNombre] = [];
    }
    acc[categoriaNombre].push(producto);
    return acc;
  }, {});

  // Eliminar producto
  const handleEliminar = async (e, id) => {
    e.stopPropagation(); // Prevenir que se abra el modal de vista
    
    const confirmacion = window.confirm("¿Estás seguro de que quieres eliminar este producto?");
    if (!confirmacion) return;

    try {
      await axios.delete(`http://localhost:3001/api/productos/eliminar/${id}`);
      setProductos(productos.filter((p) => p.id_producto !== id));
    } catch (err) {
      console.error("Error eliminando producto:", err);
      alert("Error al eliminar el producto. Inténtalo de nuevo.");
    }
  };

  // Abrir modal de edición
  const handleEditar = (e, producto) => {
    e.stopPropagation(); // Prevenir que se abra el modal de vista
    setProductoAEditar(producto);
    setIsEditModalOpen(true);
  };

  // Cerrar modal de edición
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setProductoAEditar(null);
  };

  // Actualizar producto después de la edición
  const handleProductUpdated = (productoActualizado) => {
    setProductos(productos.map((p) => 
      p.id_producto === productoActualizado.id_producto 
        ? { ...p, ...productoActualizado } 
        : p
    ));
  };

  // Abrir modal de vista de producto
  const handleVerProducto = (producto) => {
    setProductoAVer(producto);
    setIsViewModalOpen(true);
  };

  // Cerrar modal de vista
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setProductoAVer(null);
  };

  const ProductCard = ({ producto }) => (
    <div 
      className="product-card bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
      onClick={() => handleVerProducto(producto)}
      title="Ver detalles del producto"
    >
      <div className="flex space-x-3">
        <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{producto.nombre}</h3>

          <p className="text-sm text-gray-600">
            Stock: <span className={producto.stock <= 5 ? "text-red-600 font-medium" : ""}>{producto.stock}</span> unidades
            {producto.stock <= 5 && <span className="text-red-500 ml-1">⚠️</span>}
          </p>
          <p className="text-lg font-bold text-green-600">${producto.precio}</p>
          <p className="text-sm text-gray-500">
            Categoría: {producto.Categorium ? producto.Categorium.nombre : 'Sin categoría'}
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <button 
            onClick={(e) => handleEditar(e, producto)} 
            className="text-blue-600 text-sm bg-white border border-blue-300 px-3 py-1 rounded hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center z-10 relative"
            title="Editar producto"
          >
            <span className="mr-1">✏️</span>
            Editar
          </button>
          <button 
            onClick={(e) => handleEliminar(e, producto.id_producto)} 
            className="text-red-600 text-sm bg-white border border-red-300 px-3 py-1 rounded hover:bg-red-50 transition-colors duration-200 flex items-center justify-center z-10 relative"
            title="Eliminar producto"
          >
            <span className="mr-1">🗑️</span>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Mis Productos</h2>
        <button
          onClick={openModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Agregar Producto
        </button>
      </div>

      {/* Filtro por categoría */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filtrar por categoría:
        </label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="todas">Todas las categorías ({productos.length})</option>
          {categorias.map((categoria) => {
            const count = productos.filter(p => p.id_categoria === categoria.id_categoria).length;
            return (
              <option key={categoria.id_categoria} value={categoria.id_categoria}>
                {categoria.nombre} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Vista de productos */}
      {categoriaSeleccionada === 'todas' ? (
        // Vista agrupada por categorías
        <div className="space-y-6">
          {Object.entries(productosAgrupados).map(([categoriaNombre, productosCategoria]) => (
            <div key={categoriaNombre} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                  {productosCategoria.length}
                </span>
                {categoriaNombre}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                {productosCategoria.map((producto) => (
                  <ProductCard key={producto.id_producto} producto={producto} />
                ))}
              </div>
            </div>
          ))}
          {Object.keys(productosAgrupados).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg font-medium">No tienes productos registrados</p>
              <p className="text-sm mb-4">¡Comienza agregando tu primer producto!</p>
              <button
                onClick={openModal}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Agregar Primer Producto
              </button>
            </div>
          )}
        </div>
      ) : (
        // Vista filtrada por categoría específica
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                {productosFiltrados.length} productos
              </span>
              <span className="text-gray-600">
                en {categorias.find(c => c.id_categoria === parseInt(categoriaSeleccionada))?.nombre}
              </span>
            </div>
          </div>
          
          {productosFiltrados.map((producto) => (
            <ProductCard key={producto.id_producto} producto={producto} />
          ))}
          
          {productosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No hay productos en esta categoría</p>
              <p className="text-sm">Agrega productos o cambia el filtro</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de edición */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onProductUpdated={handleProductUpdated}
        producto={productoAEditar}
      />

      {/* Modal de vista de producto */}
      <ProductViewModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        producto={productoAVer}
      />
    </div>
  );
}