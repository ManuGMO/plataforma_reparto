import db from "../../models/indexModels.js";
import { Op } from "sequelize";
const { Producto, Categoria } = db;

export const getProductos = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user?.id || id;

    console.log("id_usuario", id_usuario);

    // Obtener productos con sus categorías
    const productos = await Producto.findAll({
      where: { id_usuario },
      include: [{
        model: Categoria,
        attributes: ['id_categoria', 'nombre']
      }],
      attributes: ["id_producto", "nombre", "stock", "precio", "id_categoria", "imagen", "descripcion"],
    });

    // Mapear para agregar URL completa de la imagen
    const productosConImagen = productos.map(prod => ({
      ...prod.toJSON(),
      imagen: prod.imagen
        ? `${req.protocol}://${req.get("host")}/uploads/products/${prod.imagen}`
        : null
    }));

    // Obtener todas las categorías para el dropdown
    const categorias = await Categoria.findAll({
      attributes: ['id_categoria', 'nombre']
    });

    res.json({
      productos: productosConImagen,
      categorias
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, id_categoria } = req.body;
    const imagen = req.file ? req.file.filename : null;
    const id_usuario = req.user?.id || id;

    // Verificar si ya existe un producto con el mismo nombre para este usuario
    const productoExistente = await Producto.findOne({
      where: {
        nombre: nombre.trim(),
        id_usuario: id_usuario
      }
    });

    if (productoExistente) {
      return res.status(400).json({
        message: "Ya tienes un producto con este nombre. Elige un nombre diferente.",
        duplicateProduct: {
          nombre: productoExistente.nombre,
          id_producto: productoExistente.id_producto
        }
      });
    }

    const nuevoProducto = await Producto.create({
      nombre: nombre.trim(), // Asegurar que se guarde sin espacios extra
      descripcion: descripcion ? descripcion.trim() : null, // Manejar descripción opcional
      precio,
      stock,
      id_usuario,
      id_categoria,
      imagen
    });

    // Obtener el producto creado con su categoría
    const productoCompleto = await Producto.findByPk(nuevoProducto.id_producto, {
      include: [{
        model: Categoria,
        attributes: ['id_categoria', 'nombre']
      }]
    });

    res.status(201).json(productoCompleto);
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ message: "Error al crear producto" });
  }
};

// Crear nueva categoría
export const createCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        message: "El nombre de la categoría es obligatorio"
      });
    }

    const nombreLimpio = nombre.trim();

    // Verificar si ya existe una categoría con ese nombre
    const categoriaExistente = await Categoria.findOne({
      where: {
        nombre: nombreLimpio
      }
    });

    if (categoriaExistente) {
      return res.status(400).json({
        message: "Ya existe una categoría con este nombre"
      });
    }

    // Crear la nueva categoría
    const nuevaCategoria = await Categoria.create({
      nombre: nombreLimpio
    });

    res.status(201).json({
      id_categoria: nuevaCategoria.id_categoria,
      nombre: nuevaCategoria.nombre,
      message: "Categoría creada exitosamente"
    });

  } catch (error) {
    console.error("Error al crear categoría:", error);

    // Manejar errores de duplicación de unique constraint
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: "Ya existe una categoría con este nombre"
      });
    }

    res.status(500).json({
      message: "Error interno del servidor al crear la categoría",
      details: error.message
    });
  }
};

// Obtener todas las categorías
export const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      attributes: ['id_categoria', 'nombre'],
      order: [['nombre', 'ASC']] // Ordenar alfabéticamente
    });

    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({
      error: "Error al obtener categorías",
      details: error.message
    });
  }
};



// Eliminar producto
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    const userId = req.user?.id;
    const [updatedRows] = await Producto.update(
      { activo: false },
      {
        where: {
          id_producto: id,
          activo: true,
          ...(userId ? { id_usuario: userId } : {})
        }
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado o ya eliminado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ message: "Error eliminando producto", error: error.message });
  }
};

// Actualizar producto
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, stock, precio, id_categoria } = req.body;
    const imagen = req.file ? req.file.filename : undefined;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    // Verificar que el usuario autenticado sea dueño del producto
    const userId = req.user?.id;
    if (userId && producto.id_usuario !== userId) {
      return res.status(403).json({ message: 'No autorizado para actualizar este producto' });
    }

    // Si se está actualizando el nombre, verificar duplicados
    if (nombre !== undefined && nombre.trim() !== producto.nombre) {
      const productoExistente = await Producto.findOne({
        where: {
          nombre: nombre.trim(),
          id_usuario: producto.id_usuario,
          id_producto: { [Op.ne]: id } // Excluir el producto actual
        }
      });
      if (productoExistente) {
        return res.status(400).json({
          message: "Ya tienes un producto con este nombre. Elige un nombre diferente.",
          duplicateProduct: {
            nombre: productoExistente.nombre,
            id_producto: productoExistente.id_producto
          }
        });
      }
    }

    // Solo actualizar campos que se envían
    if (nombre !== undefined) producto.nombre = nombre.trim();
    if (descripcion !== undefined) producto.descripcion = descripcion.trim() || null; // Guardar como null si está vacío
    if (stock !== undefined) producto.stock = stock;
    if (precio !== undefined) producto.precio = precio;
    if (id_categoria !== undefined) producto.id_categoria = id_categoria;
    if (imagen !== undefined) producto.imagen = imagen;

    await producto.save();

    // Obtener el producto actualizado con su categoría
    const productoCompleto = await Producto.findByPk(id, {
      include: [{
        model: Categoria,
        attributes: ['id_categoria', 'nombre']
      }]
    });

    res.json({ message: "Producto actualizado correctamente", producto: productoCompleto });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};


export const validarNombreProducto = async (req, res) => {
  try {
    const { id } = req.params; // id del usuario
    const id_usuario = req.user?.id || id;
    const { nombre, exclude_id } = req.body;

    const whereCondition = {
      nombre: nombre.trim(),
      id_usuario: id_usuario
    };

    // Si se proporciona exclude_id, excluir ese producto de la búsqueda
    if (exclude_id) {
      whereCondition.id_producto = { [Op.ne]: exclude_id };
    }

    const productoExistente = await Producto.findOne({
      where: whereCondition
    });

    if (productoExistente) {
      return res.status(400).json({
        isValid: false,
        message: "Ya tienes un producto con este nombre",
        duplicateProduct: {
          nombre: productoExistente.nombre,
          id_producto: productoExistente.id_producto
        }
      });
    }

    res.json({ isValid: true, message: "Nombre disponible" });
  } catch (error) {
    console.error("Error validando nombre:", error);
    res.status(500).json({ message: "Error al validar nombre" });
  }
};