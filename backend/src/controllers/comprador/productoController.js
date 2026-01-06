// src/controllers/comprador/productoController.js
import db from "../../models/indexModels.js";

/**
 * Obtener todos los productos activos con sus categorías y vendedores
 * GET /api/productos
 */
export const getProductos = async (req, res) => {
  try {
    const productos = await db.Producto.findAll({
      include: [
        {
          model: db.Categoria,
          attributes: ['id_categoria', 'nombre']
        },
        {
          model: db.Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre','latitud','longitud']
        }
      ],
      where: {
        activo: true,
        stock: {
          [db.Sequelize.Op.gt]: 0 // Solo productos con stock
        }
      },
      order: [['nombre', 'ASC']]
    });

    // Transformar los datos para que coincidan con el frontend
    const productosTransformados = productos.map(producto => {
      const categoriaNombre = producto.Categoria && producto.Categoria.nombre ? producto.Categoria.nombre.toLowerCase() : 'sin categoria';
      const vendedorNombre = producto.Vendedor && producto.Vendedor.nombre ? producto.Vendedor.nombre : 'Vendedor';
      const lat = producto.Vendedor && producto.Vendedor.latitud ? producto.Vendedor.latitud : null;
      const lng = producto.Vendedor && producto.Vendedor.longitud ? producto.Vendedor.longitud : null;

      return {
        id: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen ? `${req.protocol}://${req.get("host")}/uploads/products/${producto.imagen}` : null,
        categoria: categoriaNombre,
        vendedor: vendedorNombre,
        latitud: lat,
        longitud: lng,
        stock: producto.stock,
        descripcion: producto.descripcion,
        id_categoria: producto.id_categoria,
        id_vendedor: producto.id_usuario
      };
    });

    return res.json(productosTransformados);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return res.status(500).json({ 
      message: "Error al obtener productos",
      error: error.message 
    });
  }
};

/**
 * Obtener productos por categoría
 * GET /api/productos/categoria/:nombre
 */
export const getProductosPorCategoria = async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const productos = await db.Producto.findAll({
      include: [
        {
          model: db.Categoria,
          attributes: ['id_categoria', 'nombre'],
          where: {
            nombre: {
              [db.Sequelize.Op.iLike]: `%${nombre}%`
            }
          }
        },
        {
          model: db.Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre', 'apellido']
        }
      ],
      where: {
        activo: true,
        stock: {
          [db.Sequelize.Op.gt]: 0
        }
      },
      order: [['nombre', 'ASC']]
    });

    const productosTransformados = productos.map(producto => {

      const categoriaNombre = producto.Categorium.nombre.toLowerCase();
      
      console.log("Categoria: ", categoriaNombre);

      return {
        id: producto.id_producto,
        nombre: producto.nombre,
        precio: parseFloat((producto.precio / 100).toFixed(2)),
        imagen: producto.imagen,
        categoria: categoriaNombre,
        vendedor: producto.Vendedor ? 
          `${producto.Vendedor.nombre} ${producto.Vendedor.apellido}` : 
          'Vendedor',
        ubicacion: "A 0.8 km de ti",
        rating: 4.5,
        stock: producto.stock,
        id_categoria: producto.id_categoria,
        id_vendedor: producto.id_usuario
      };
    });

    return res.json(productosTransformados);
  } catch (error) {
    console.error("Error al obtener productos por categoría:", error);
    return res.status(500).json({ 
      message: "Error al obtener productos por categoría",
      error: error.message 
    });
  }
};