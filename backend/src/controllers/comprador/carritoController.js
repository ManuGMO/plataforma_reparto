// src/controllers/comprador/carritoController.js
import db from "../../models/indexModels.js";
import { Op } from "sequelize";


export const obtenerCarrito = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    // Buscar o crear carrito del usuario
    let carrito = await db.Carrito.findOne({
      where: { id_usuario: Number(id_usuario) },
      include: [
        {
          model: db.Producto,
          include: [
            {
              model: db.Categoria,
              attributes: ['nombre']
            },
            {
              model: db.Usuario,
              as: 'Vendedor',
              attributes: ['nombre']
            }
          ],
          through: {
            attributes: ['cantidad']
          }
        }
      ]
    });

    if (!carrito) {
      carrito = await db.Carrito.create({ id_usuario: Number(id_usuario) });
      return res.json({ items: [], subtotal: 0, total: 0 });
    }


    const items = carrito.Productos.map(producto => {
      const categoriaNombre = producto.Categoria?.nombre?.toLowerCase() || 'comida';
      const cantidad = producto.Carrito_Producto.cantidad;
      const precioUnitario = producto.precio

      return {
        id: producto.id_producto,
        nombre: producto.nombre,
        precio: precioUnitario,
        cantidad: cantidad,
        subtotal: producto.precio,
        imagen: producto.imagen ? `${req.headers['x-forwarded-proto'] || (req.get("host").includes("localhost") || req.get("host").includes("127.0.0.1") ? "http" : "https")}://${req.get("host")}/uploads/products/${producto.imagen}`
          : null,
        categoria: categoriaNombre,
        vendedor: producto.Vendedor ?
          `${producto.Vendedor.nombre}` :
          'Vendedor',
        stock: producto.stock,
        id_vendedor: producto.id_usuario
      };
    });

    const subtotal = parseFloat(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const total = subtotal;

    return res.json({
      id_carrito: carrito.id_carrito,
      items,
      subtotal,
      total
    });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    return res.status(500).json({
      message: "Error al obtener carrito",
      error: error.message
    });
  }
};


export const agregarAlCarrito = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    console.log("agregarAlCarrito");
    console.log(req.headers);
    console.log(req.body);

    const { id_usuario } = req.params;
    const { id_producto, cantidad = 1 } = req.body;

    if (!id_producto || cantidad < 1) {
      await t.rollback();
      return res.status(400).json({ message: "Datos inválidos" });
    }

    // Verificar que el producto existe y tiene stock
    const producto = await db.Producto.findByPk(id_producto, { transaction: t });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (producto.stock < cantidad) {
      await t.rollback();
      return res.status(400).json({ message: "Stock insuficiente" });
    }

    // Buscar o crear carrito
    let carrito = await db.Carrito.findOne({
      where: { id_usuario: Number(id_usuario) },
      transaction: t
    });

    if (!carrito) {
      carrito = await db.Carrito.create({ id_usuario: Number(id_usuario) }, { transaction: t });
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = await db.Carrito_Producto.findOne({
      where: {
        id_carrito: carrito.id_carrito,
        id_producto: Number(id_producto)
      },
      transaction: t
    });

    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + Number(cantidad);

      if (producto.stock < nuevaCantidad) {
        await t.rollback();
        return res.status(400).json({ message: "Stock insuficiente para la cantidad solicitada" });
      }

      await itemExistente.update({ cantidad: nuevaCantidad }, { transaction: t });
    } else {
      await db.Carrito_Producto.create({
        id_carrito: carrito.id_carrito,
        id_producto: Number(id_producto),
        cantidad: Number(cantidad)
      }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json({ message: "Producto agregado al carrito" });
  } catch (error) {
    await t.rollback();
    console.error("Error al agregar producto al carrito:", error);
    return res.status(500).json({
      message: "Error al agregar producto al carrito",
      error: error.message
    });
  }
};


export const eliminarDelCarrito = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_usuario, id_producto } = req.params;

    const carrito = await db.Carrito.findOne({
      where: { id_usuario: Number(id_usuario) },
      transaction: t
    });

    if (!carrito) {
      await t.rollback();
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const resultado = await db.Carrito_Producto.destroy({
      where: {
        id_carrito: carrito.id_carrito,
        id_producto: Number(id_producto)
      },
      transaction: t
    });

    if (resultado === 0) {
      await t.rollback();
      return res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }

    await t.commit();
    return res.json({ message: "Producto eliminado del carrito" });
  } catch (error) {
    await t.rollback();
    console.error("Error al eliminar producto del carrito:", error);
    return res.status(500).json({
      message: "Error al eliminar producto del carrito",
      error: error.message
    });
  }
};


export const actualizarCantidadCarrito = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_usuario, id_producto } = req.params;
    const { cantidad } = req.body;

    if (!cantidad || cantidad < 1) {
      await t.rollback();
      return res.status(400).json({ message: "Cantidad inválida" });
    }

    // Verificar stock
    const producto = await db.Producto.findByPk(id_producto, { transaction: t });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (producto.stock < cantidad) {
      await t.rollback();
      return res.status(400).json({ message: "Stock insuficiente" });
    }

    const carrito = await db.Carrito.findOne({
      where: { id_usuario: Number(id_usuario) },
      transaction: t
    });

    if (!carrito) {
      await t.rollback();
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const [numActualizados] = await db.Carrito_Producto.update(
      { cantidad: Number(cantidad) },
      {
        where: {
          id_carrito: carrito.id_carrito,
          id_producto: Number(id_producto)
        },
        transaction: t
      }
    );

    if (numActualizados === 0) {
      await t.rollback();
      return res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }

    await t.commit();
    return res.json({ message: "Cantidad actualizada" });
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar cantidad:", error);
    return res.status(500).json({
      message: "Error al actualizar cantidad",
      error: error.message
    });
  }
};


export const vaciarCarrito = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_usuario } = req.params;

    const carrito = await db.Carrito.findOne({
      where: { id_usuario: Number(id_usuario) },
      transaction: t
    });

    if (!carrito) {
      await t.rollback();
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    await db.Carrito_Producto.destroy({
      where: { id_carrito: carrito.id_carrito },
      transaction: t
    });

    await t.commit();
    return res.json({ message: "Carrito vaciado" });
  } catch (error) {
    await t.rollback();
    console.error("Error al vaciar carrito:", error);
    return res.status(500).json({
      message: "Error al vaciar carrito",
      error: error.message
    });
  }
};