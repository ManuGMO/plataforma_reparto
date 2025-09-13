// src/controllers/comprador/pedidoController.js
import db from "../../models/indexModels.js";
import { Op } from "sequelize";
import Pedido from "../../models/Pedido.js";


export const crearPedidoDesdeCarrito = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_comprador, direccion } = req.body;
    
    if (!id_comprador) {
      return res.status(400).json({ message: "ID de comprador es requerido" });
    }

    // Obtener carrito del comprador
    const carrito = await db.Carrito.findOne({
      where: { id_usuario: id_comprador },
      include: [
        {
          model: db.Producto,
          include: [
            {
              model: db.Usuario,
              as: 'Vendedor',
              attributes: ['id_usuario', 'nombre']
            }
          ],
          through: {
            attributes: ['cantidad']
          }
        }
      ],
      transaction: t
    });

    if (!carrito || !carrito.Productos || carrito.Productos.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    // Verificar stock de todos los productos
    for (const producto of carrito.Productos) {
      if (producto.stock < producto.Carrito_Producto.cantidad) {
        return res.status(400).json({ 
          message: `Stock insuficiente para ${producto.nombre}` 
        });
      }
    }

    // Calcular total y obtener vendedores únicos
    let total = 0;
    const vendedoresSet = new Set(); // Para almacenar IDs de vendedores únicos
    
    const items = carrito.Productos.map(p => {
      const cantidad = p.Carrito_Producto.cantidad;
      const precio_unitario = Number(p.precio);
      total += precio_unitario * cantidad;
      
      // Agregar ID del vendedor al Set (evita duplicados automáticamente)
      if (p.Vendedor && p.Vendedor.id_usuario) {
        vendedoresSet.add(p.Vendedor.id_usuario);
      }
      
      return {
        id_producto: p.id_producto,
        cantidad: cantidad,
        precio_unitario: precio_unitario
      };
    });

    // Crear pedido
    const pedido = await db.Pedido.create(
      {
        direccion: direccion || null,
        total: Math.round(total),
        estado: "pendiente"
      },
      { transaction: t }
    );

    // Insertar detalle en Producto_Pedido
    const detalleRows = items.map(it => ({
      id_pedido: pedido.id_pedido,
      id_producto: it.id_producto,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario
    }));

    await db.Producto_Pedido.bulkCreate(detalleRows, { transaction: t });

    // Vincular comprador
    await db.pedido_comprador.create(
      { id_pedido: pedido.id_pedido, id_usuario: id_comprador },
      { transaction: t }
    );

    // NUEVO: Vincular todos los vendedores únicos del pedido
    const vendedorRows = Array.from(vendedoresSet).map(id_vendedor => ({
      id_pedido: pedido.id_pedido,
      id_usuario: id_vendedor
    }));

    if (vendedorRows.length > 0) {
      await db.pedido_vendedor.bulkCreate(vendedorRows, { transaction: t });
    }

    // Actualizar stock de productos
    for (const item of items) {
      await db.Producto.decrement('stock', {
        by: item.cantidad,
        where: { id_producto: item.id_producto },
        transaction: t
      });
    }

    // Vaciar carrito
    await db.Carrito_Producto.destroy({
      where: { id_carrito: carrito.id_carrito },
      transaction: t
    });

    await t.commit();

    // Devolver pedido completo
    const pedidoCompleto = await db.Pedido.findByPk(pedido.id_pedido, {
      include: [
        {
          model: db.Producto,
          include: [
            {
              model: db.Categoria,
              attributes: ['nombre']
            }
          ],
          through: { attributes: ["cantidad", "precio_unitario"] }
        },
        { model: db.Usuario, as: "Comprador", through: { attributes: [] } },
        { model: db.Usuario, as: "Vendedor", through: { attributes: [] } }
      ]
    });

    return res.status(201).json(pedidoCompleto);
  } catch (error) {
    await t.rollback();
    console.error("Error al crear pedido:", error);
    return res.status(500).json({ 
      message: "Error al crear pedido",
      error: error.message 
    });
  }
};


export const crearPedido = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_comprador, id_vendedor, direccion, productos } = req.body;

    if (!id_comprador || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "Datos incompletos del pedido" });
    }

    // Traer productos de DB
    const ids = productos.map(p => p.id_producto);
    const productosDB = await db.Producto.findAll({
      where: { id_producto: { [Op.in]: ids } },
      transaction: t,
      paranoid: false
    });

    if (productosDB.length !== productos.length) {
      return res.status(400).json({ message: "Uno o más productos no existen" });
    }

    // Verificar stock
    for (const prod of productos) {
      const productoDB = productosDB.find(p => p.id_producto === prod.id_producto);
      if (productoDB.stock < prod.cantidad) {
        return res.status(400).json({ 
          message: `Stock insuficiente para ${productoDB.nombre}` 
        });
      }
    }

    // Calcular total (precio * cantidad)
    let total = 0;
    const items = productos.map(p => {
      const prod = productosDB.find(x => x.id_producto === p.id_producto);
      const precio_unitario = Number(prod.precio);
      total += precio_unitario * Number(p.cantidad);
      return {
        id_producto: p.id_producto,
        cantidad: Number(p.cantidad),
        precio_unitario
      };
    });

    // Crear pedido
    const pedido = await db.Pedido.create(
      {
        direccion: direccion || null,
        total: Math.round(total),
        estado: "pendiente"
      },
      { transaction: t }
    );

    // Insertar detalle en Producto_Pedido
    const detalleRows = items.map(it => ({
      id_pedido: pedido.id_pedido,
      id_producto: it.id_producto,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario
    }));

    await db.Producto_Pedido.bulkCreate(detalleRows, { transaction: t });

    // Vincular comprador (tabla intermedia pedido_comprador)
    await db.pedido_comprador.create(
      { id_pedido: pedido.id_pedido, id_usuario: id_comprador },
      { transaction: t }
    );

    // (Opcional) Vincular vendedor (si llega)
    if (id_vendedor) {
      await db.pedido_vendedor.create(
        { id_pedido: pedido.id_pedido, id_usuario: id_vendedor },
        { transaction: t }
      );
    }

    // Actualizar stock
    for (const item of items) {
      await db.Producto.decrement('stock', {
        by: item.cantidad,
        where: { id_producto: item.id_producto },
        transaction: t
      });
    }

    await t.commit();

    // Devolver pedido completo
    const pedidoCompleto = await db.Pedido.findByPk(pedido.id_pedido, {
      include: [
        {
          model: db.Producto,
          include: [
            {
              model: db.Categoria,
              attributes: ['nombre']
            }
          ],
          through: { attributes: ["cantidad", "precio_unitario"] }
        },
        { model: db.Usuario, as: "Comprador", through: { attributes: [] } },
        { model: db.Usuario, as: "Vendedor", through: { attributes: [] } }
      ]
    });

    return res.status(201).json(pedidoCompleto);
  } catch (error) {
    await t.rollback();
    console.error("Error al crear pedido:", error);
    return res.status(500).json({ message: "Error al crear pedido" });
  }
};

/**
 * Pedidos por COMPRADOR
 * GET /api/pedidos/comprador/:id_usuario
 */
export const obtenerPedidosDelComprador = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    console.log("HOLAAA", id_usuario);

    const pedidosComprador = await db.pedido_comprador.findAll({
      where: { id_usuario: id_usuario },
      attributes: ['id_pedido']
    });

    console.log("PEdidoS: ", pedidosComprador);

    if (pedidosComprador.length === 0) {
      return res.json([]);
    }

    // Extraer los IDs de pedidos
    const idsPedidos = pedidosComprador.map(pc => pc.id_pedido);

    console.log("Ids: ", idsPedidos);

    // Paso 2: Obtener los pedidos completos con sus relaciones
    const pedidos = await db.Pedido.findAll({
      where: {
        id_pedido: { [Op.in]: idsPedidos }
      },
      include: [
        // productos con detalle
        {
          model: db.Producto,
          include: [
            { 
              model: db.Categoria, 
              attributes: ["id_categoria", "nombre"] 
            },
            {
              model: db.Usuario,
              as: 'Vendedor',
              attributes: ['nombre']
            }
          ],
          through: { attributes: ["cantidad", "precio_unitario"] }
        },
        // Incluir información del comprador (opcional, para verificación)
        { 
          model: db.Usuario, 
          as: "Comprador", 
          through: { attributes: [] },
          attributes: ['id_usuario', 'nombre']
        },
        // (opcional) vendedor asignado (si existe)
        { 
          model: db.Usuario, 
          as: "Vendedor", 
          through: { attributes: [] },
          required: false
        }
      ],
      order: [["fecha_creacion", "DESC"]]
    });

    // Transformar datos para el frontend
    const pedidosTransformados = pedidos.map(pedido => {
      const items = pedido.Productos.map(producto => {
        const cantidad = producto.Producto_Pedido.cantidad;
        const precio_unitario = producto.Producto_Pedido.precio_unitario
        
        return {
          nombre: producto.nombre,
          cantidad: cantidad,
          precio: precio_unitario,
          subtotal: precio_unitario * cantidad,
          vendedor: producto.Vendedor ? 
            `${producto.Vendedor.nombre}` : 
            'Vendedor'
        };
      });

      const estadoMap = {
        'pendiente': 'en-espera',
        'aceptado': 'preparando',
        'listo_para_recoger': 'esperando-repartidor',
        'en_reparto': 'en-camino',
        'entregado': 'entregado',
        'rechazado': 'cancelado',
        'cancelado': 'cancelado'
      };

      return {
        id: pedido.id_pedido,
        estado: estadoMap[pedido.estado] || pedido.estado,
        fecha: new Date(pedido.fecha_creacion).toLocaleDateString('es-CL'),
        total: pedido.total,
        items: items,
        direccion: pedido.direccion
      };
    });

    return res.json(pedidosTransformados);
  } catch (error) {
    console.error("Error al obtener pedidos del comprador:", error);
    return res.status(500).json({ 
      message: "Error al obtener pedidos",
      error: error.message 
    });
  }
};

/**
 * Actualizar estado del pedido
 * PUT /api/pedidos/:id_pedido/estado
 * Body: { estado: 'pendiente' | 'aceptado' | 'listo_para_recoger' | 'en_reparto' | 'entregado' | 'rechazado' | 'cancelado' }
 */
export const actualizarEstadoPedido = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const { estado } = req.body;

    const valoresValidos = [
      "pendiente",
      "aceptado",
      "listo_para_recoger",
      "en_reparto",
      "entregado",
      "rechazado",
      "cancelado"
    ];

    if (!valoresValidos.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const pedido = await db.Pedido.findByPk(id_pedido);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });

    await pedido.update({ estado });

    return res.json(pedido);
  } catch (error) {
    console.error("Error al actualizar estado del pedido:", error);
    return res.status(500).json({ message: "Error al actualizar estado del pedido" });
  }
};