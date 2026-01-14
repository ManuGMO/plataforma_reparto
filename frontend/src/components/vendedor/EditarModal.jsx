import { useEffect, useState } from "react";
import axios from "axios";

export default function EditProductModal({ isOpen, onClose, onProductUpdated, producto }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [notification, setNotification] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Estados para validación de nombre
  const [nameValidation, setNameValidation] = useState({ isValid: true, message: "" });
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  // Estados para imagen
  const [imagenFile, setImagenFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  // Estados para crear nueva categoría
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (isOpen && producto) {
      setNombre(producto.nombre || "");
      setPrecio(producto.precio || "");
      setStock(producto.stock || "");
      setIdCategoria(producto.id_categoria || "");
      setDescripcion(producto.descripcion || "");

      // Configurar imagen actual
      if (producto.imagen) {
        setPreviewUrl(`${producto.imagen}`);
      } else {
        setPreviewUrl("");
      }
      setImagenFile(null);
      setNameValidation({ isValid: true, message: "" });
      setNameSuggestions([]);
      setIsValidatingName(false);

      // Cargar categorías
      const fetchCategorias = async () => {
        try {
          const res = await axios.get("http://localhost:3001/api/productos/obtener/1");
          setCategorias(res.data.categorias);
        } catch (error) {
          console.error("Error cargando categorías:", error);
        }
      };
      fetchCategorias();
    }
  }, [isOpen, producto]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFile(file);
      setRemoveImage(false);

      // Crear URL de preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagenFile(null);
    setPreviewUrl("");
    setRemoveImage(true);
    // Resetear el input file
    const fileInput = document.getElementById('imagen-input');
    if (fileInput) fileInput.value = '';
  };

  const handleRestoreOriginalImage = () => {
    setImagenFile(null);
    setRemoveImage(false);
    if (producto.imagen) {
      setPreviewUrl(`http://localhost:3001/uploads/products/${producto.imagen}`);
    } else {
      setPreviewUrl("");
    }
    // Resetear el input file
    const fileInput = document.getElementById('imagen-input');
    if (fileInput) fileInput.value = '';
  };

  // Validar nombre en tiempo real
  const validateName = async (newName) => {
    if (!newName.trim() || newName.trim() === producto.nombre) {
      setNameValidation({ isValid: true, message: "" });
      setNameSuggestions([]);
      return;
    }

    setIsValidatingName(true);
    try {
      const response = await axios.post(`http://localhost:3001/api/productos/validar-nombre/1`, {
        nombre: newName.trim(),
        exclude_id: producto.id_producto
      });

      setNameValidation({ isValid: true, message: "✓ Nombre disponible" });
      setNameSuggestions([]);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setNameValidation({
          isValid: false,
          message: error.response.data.message
        });

        // Generar sugerencias
        const suggestions = [
          `${newName.trim()} v2`,
          `${newName.trim()} (nuevo)`,
          `${newName.trim()} - ${new Date().getFullYear()}`,
          `${newName.trim()} premium`,
          `${newName.trim()} especial`
        ];
        setNameSuggestions(suggestions.slice(0, 3));
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
    if (!nombre) return;

    const timeoutId = setTimeout(() => {
      validateName(nombre);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [nombre, producto?.id_producto]);

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
    if (isLoading || !producto) return;
    // Validaciones
    if (nombre !== undefined && nombre.trim() === "") {
      setNotification("El nombre no puede estar vacío");
      return;
    }
    if (!nameValidation.isValid) {
      setNotification("El nombre del producto ya existe. Elige un nombre diferente.");
      return;
    }
    if (precio !== undefined && (precio === "" || precio <= 0)) {
      setNotification("El precio debe ser mayor a 0");
      return;
    }
    if (stock !== undefined && (stock === "" || stock < 0)) {
      setNotification("El stock no puede ser negativo");
      return;
    }
    if (!idCategoria && !showNewCategoryInput) {
      setNotification("Debes seleccionar una categoría");
      return;
    }
    setIsLoading(true);
    setNotification("");
    try {
      // Crear FormData para manejar archivo
      const formData = new FormData();

      // Solo agregar campos que han cambiado
      let hasChanges = false;

      if (nombre.trim() !== producto.nombre) {
        formData.append('nombre', nombre.trim());
        hasChanges = true;
      }

      // Comparar descripción (manejar null/undefined vs string vacío)
      const descripcionActual = producto.descripcion || "";
      const descripcionNueva = descripcion.trim();
      if (descripcionNueva !== descripcionActual) {
        formData.append('descripcion', descripcionNueva);
        hasChanges = true;
      }

      if (parseInt(precio) !== producto.precio) {
        formData.append('precio', parseInt(precio));
        hasChanges = true;
      }
      if (parseInt(stock) !== producto.stock) {
        formData.append('stock', parseInt(stock));
        hasChanges = true;
      }
      if (parseInt(idCategoria) !== producto.id_categoria) {
        formData.append('id_categoria', parseInt(idCategoria));
        hasChanges = true;
      }

      // Manejar imagen
      if (imagenFile) {
        formData.append('imagen', imagenFile);
        hasChanges = true;
      } else if (removeImage && producto.imagen) {
        // Si se quiere remover la imagen y el producto tenía una
        formData.append('removeImage', 'true');
        hasChanges = true;
      }

      // Si no hay cambios, cerrar modal
      if (!hasChanges) {
        handleClose();
        return;
      }

      const res = await axios.put(
        `http://localhost:3001/api/productos/actualizar/${producto.id_producto}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setNotification("");
      onProductUpdated(res.data.producto);
      onClose();

    } catch (error) {
      console.error("Error actualizando producto:", error);
      setNotification(error.response?.data?.message || "Error al actualizar producto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setIdCategoria("");
    setNuevaCategoria("");
    setShowNewCategoryInput(false);
    setNotification("");
    setImagenFile(null);
    setPreviewUrl("");
    setRemoveImage(false);
    onClose();
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-900">
          Editar Producto
        </h2>

        {notification && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {notification}
          </div>
        )}

        <div className="space-y-4">
          {/* Información actual */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Producto actual:</h4>
            <p className="text-sm text-gray-600">
              <strong>{producto.nombre}</strong> - ${producto.precio} - Stock: {producto.stock}
            </p>
            <p className="text-xs text-gray-500">
              Categoría: {producto.Categorium ? producto.Categorium.nombre : 'Sin categoría'}
            </p>
          </div>

          {/* Imagen del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del producto
            </label>

            {/* Preview de imagen actual/nueva */}
            <div className="mb-3">
              {previewUrl ? (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Input para nueva imagen */}
            <input
              id="imagen-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {/* Botones de control de imagen */}
            <div className="flex gap-2 mt-2">
              {producto.imagen && (removeImage || imagenFile) && (
                <button
                  type="button"
                  onClick={handleRestoreOriginalImage}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Restaurar imagen original
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
            </p>
          </div>

          {/* Nombre del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del producto
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={producto.nombre}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:border-blue-500 pr-10 ${nameValidation.isValid
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
              <p className={`text-xs mt-1 ${nameValidation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                {nameValidation.message}
              </p>
            )}


            <p className="text-xs text-gray-500 mt-1">
              Deja vacío para mantener: "{producto.nombre}"
            </p>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>

            {!showNewCategoryInput ? (
              <select
                value={idCategoria}
                onChange={handleCategorySelectChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categorias.map((categoria) => (
                  <option key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
              </div>
            )}
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                placeholder={producto.precio.toString()}
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full border border-gray-300 pl-8 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Deja vacío para mantener: ${producto.precio}
            </p>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              placeholder={producto.stock.toString()}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deja vacío para mantener: {producto.stock} unidades
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            placeholder={producto.descripcion || "Sin descripción"}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
            rows="3"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            Deja vacío para mantener: "{producto.descripcion || 'Sin descripción'}" ({descripcion.length}/500 caracteres)
          </p>
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
            disabled={isLoading || isCreatingCategory || showNewCategoryInput}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Actualizando...
              </>
            ) : (
              "Actualizar Producto"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}