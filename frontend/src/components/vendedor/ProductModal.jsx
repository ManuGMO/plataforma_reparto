import { useEffect, useState } from "react";
import axios from "axios";

export default function ProductModal({ isOpen, onClose, onProductAdded }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [notification, setNotification] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagen, setImagen] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  
  // Estados para validación de nombre
  const [nameValidation, setNameValidation] = useState({ isValid: true, message: "" });
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  
  // Estados para crear nueva categoría
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Cargar categorías cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const fetchCategorias = async () => {
        try {
          const res = await axios.get("http://localhost:3001/api/productos/recuperar_categoria");
          setCategorias(res.data);
          console.log("Categoriassss: ", res.data);
        } catch (error) {
          console.error("Error cargando categorías:", error);
        }
      };
      fetchCategorias();
    }
  }, [isOpen]);

  // Validar nombre en tiempo real
  const validateName = async (newName) => {
    if (!newName.trim()) {
      setNameValidation({ isValid: true, message: "" });
      setNameSuggestions([]);
      return;
    }

    setIsValidatingName(true);
    try {
      const response = await axios.post(`http://localhost:3001/api/productos/validar-nombre/1`, {
        nombre: newName.trim()
      });
      
      setNameValidation({ isValid: true, message: "✓ Nombre disponible" });
      setNameSuggestions([]);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setNameValidation({ 
          isValid: false, 
          message: error.response.data.message 
        });
      } else {
        setNameValidation({ isValid: true, message: "" });
        setNameSuggestions([]);
      }
    } finally {
      setIsValidatingName(false);
    }
  };

  // Debounce para validación de nombre
  useEffect(() => {
    if (!nombre.trim()) {
      setNameValidation({ isValid: true, message: "" });
      setNameSuggestions([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      validateName(nombre);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nombre]);

  const handleCreateCategory = async () => {
    if (!nuevaCategoria.trim()) {
      setNotification("El nombre de la categoría es obligatorio");
      return;
    }

    // Verificar si la categoría ya existe
    const categoriaExistente = categorias.find(
      cat => cat.nombre.toLowerCase() === nuevaCategoria.trim().toLowerCase()
    );
    
    if (categoriaExistente) {
      setNotification("Esta categoría ya existe");
      return;
    }

    setIsCreatingCategory(true);
    setNotification("");

    try {
      const res = await axios.post("http://localhost:3001/api/productos/crear_categoria", {
        nombre: nuevaCategoria.trim()
      });

      // Agregar la nueva categoría a la lista
      const nuevaCat = res.data;
      setCategorias(prev => [...prev, nuevaCat]);
      
      // Seleccionar automáticamente la nueva categoría
      setIdCategoria(nuevaCat.id_categoria);
      
      // Limpiar y ocultar el input
      setNuevaCategoria("");
      setShowNewCategoryInput(false);
      
      setNotification(""); // Limpiar notificación de éxito
      
    } catch (error) {
      console.error("Error creando categoría:", error);
      setNotification(error.response?.data?.message || "Error al crear la categoría");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCancelNewCategory = () => {
    setNuevaCategoria("");
    setShowNewCategoryInput(false);
    setNotification("");
  };

  const handleCategorySelectChange = (e) => {
    const value = e.target.value;
    if (value === "nueva") {
      setShowNewCategoryInput(true);
      setIdCategoria("");
    } else {
      setIdCategoria(value);
      setShowNewCategoryInput(false);
    }
  };

  const handleSave = async () => {
    if (isLoading) return;
    // Validaciones
    if (!nombre.trim()) {
      setNotification("El nombre es obligatorio");
      return;
    }
    if (!nameValidation.isValid) {
      setNotification("El nombre del producto ya existe. Elige un nombre diferente.");
      return;
    }
    if (!precio || precio <= 0) {
      setNotification("El precio debe ser mayor a 0");
      return;
    }
    if (!stock || stock < 0) {
      setNotification("El stock no puede ser negativo");
      return;
    }
    if (!idCategoria && !showNewCategoryInput) {
      setNotification("Debes seleccionar una categoría o crear una nueva");
      return;
    }
    setIsLoading(true);
    setNotification("");
    try {
      const formData = new FormData();
      formData.append("nombre", nombre.trim());
      formData.append("descripcion", descripcion.trim());
      formData.append("precio", parseInt(precio));
      formData.append("stock", parseInt(stock));
      formData.append("id_categoria", parseInt(idCategoria));
      if (imagen) {
        formData.append("imagen", imagen);
      }
      await axios.post("http://localhost:3001/api/productos/publicar/1", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Limpiar formulario
      handleClose();
      onProductAdded();
    
    } catch (error) {
      console.error("Error agregando producto:", error);
    
      // Manejar error específico de producto duplicado
      if (error.response && error.response.status === 400) {
        const errorData = error.response.data;
        setNotification(errorData.message);
      
        // Si hay información del producto duplicado, generar sugerencias
        if (errorData.duplicateProduct) {
          const suggestions = [
            `${nombre.trim()} v2`,
            `${nombre.trim()} (nuevo)`,
            `${nombre.trim()} - ${new Date().getFullYear()}`,
            `${nombre.trim()} premium`,
            `${nombre.trim()} especial`
          ];
          setNameSuggestions(suggestions.slice(0, 3));
        }
      } else {
        setNotification(error.response?.data?.message || "Error al agregar producto");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // También actualizar la función handleClose para limpiar la descripción
  const handleClose = () => {
    setNombre("");
    setDescripcion(""); // Agregar esta línea
    setPrecio("");
    setStock("");
    setIdCategoria("");
    setImagen(null);
    setNotification("");
    setNameSuggestions([]);
    setNuevaCategoria("");
    setShowNewCategoryInput(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Agregar Producto</h2>

        {notification && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {notification}
          </div>
        )}

        <div className="space-y-4">
          {/* Nombre del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del producto *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: Hamburguesa clásica"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:border-blue-500 pr-10 ${
                  nameValidation.isValid 
                    ? 'border-gray-300 focus:ring-blue-500' 
                    : 'border-red-300 focus:ring-red-500'
                }`}
                maxLength={100}
              />
              {isValidatingName && (
                <div className="absolute right-3 top-2.5">
                  <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Mensaje de validación */}
            {nameValidation.message && (
              <p className={`text-xs mt-1 ${
                nameValidation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {nameValidation.message}
              </p>
            )}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            
            {!showNewCategoryInput ? (
              <select
                value={idCategoria}
                onChange={handleCategorySelectChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la nueva categoría"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={100}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                      if (e.key === 'Escape') {
                        handleCancelNewCategory();
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory || !nuevaCategoria.trim()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isCreatingCategory ? "..." : "✓"}
                  </button>
                  <button
                    onClick={handleCancelNewCategory}
                    className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm font-medium"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Presiona Enter para crear o Escape para cancelar
                </p>
              </div>
            )}
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                placeholder="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full border border-gray-300 pl-8 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock inicial *
            </label>
            <input
              type="number"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">Cantidad disponible para venta</p>
          </div>
          {/* Descripción del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              placeholder="Describe tu producto..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
              rows="3"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              Opcional: Añade detalles que ayuden a los compradores ({descripcion.length}/500 caracteres)
            </p>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen del producto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagen(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">Opcional: Agrega una foto de tu producto</p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading || isCreatingCategory}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isCreatingCategory || showNewCategoryInput || !nameValidation.isValid}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              "Guardar Producto"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}