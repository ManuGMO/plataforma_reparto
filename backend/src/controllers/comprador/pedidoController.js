// src/controllers/comprador/pedidoController.js
import db from "../../models/indexModels.js";
import { Op } from "sequelize";
import Pedido from "../../models/Pedido.js";


export const crearPedidoDesdeCarrito = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id_comprador, direccion, latitud, longitud, metodo_pago } = req.body;

    console.log('📦 Datos recibidos:', { id_comprador, direccion, latitud, longitud, metodo_pago });
    console.log('📁 Archivo comprobante:', req.file);

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
      await t.rollback();
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    // Verificar stock
    for (const producto of carrito.Productos) {
      if (producto.stock < producto.Carrito_Producto.cantidad) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para ${producto.nombre}`
        });
      }
    }

    // Calcular total
    let subtotal = 0;
    const vendedoresSet = new Set();

    const items = carrito.Productos.map(p => {
      const cantidad = p.Carrito_Producto.cantidad;
      const precio_unitario = Number(p.precio);
      subtotal += precio_unitario * cantidad;

      if (p.Vendedor && p.Vendedor.id_usuario) {
        vendedoresSet.add(p.Vendedor.id_usuario);
      }

      return {
        id_producto: p.id_producto,
        cantidad,
        precio_unitario
      };
    });

    // Leer desglose de montos enviado desde el frontend (viene como string en FormData)
    let precio_bruto = req.body.precio_bruto ? Number(req.body.precio_bruto) : subtotal;
    if (!Number.isFinite(precio_bruto)) precio_bruto = subtotal;

    // Comisión servicio: preferir el valor enviado, sino 10% del subtotal
    let comision_servicio = req.body.comision_servicio ? Number(req.body.comision_servicio) : Math.round(precio_bruto * 0.10);
    if (!Number.isFinite(comision_servicio)) comision_servicio = Math.round(precio_bruto * 0.10);

    // Pago reparto: preferir el valor enviado, sino 5% del subtotal
    let pago_reparto = req.body.pago_reparto ? Number(req.body.pago_reparto) : Math.round(precio_bruto * 0.05);
    if (!Number.isFinite(pago_reparto)) pago_reparto = Math.round(precio_bruto * 0.05);

    // Comisión al vendedor: valor que se deduce al vendedor (no visible al comprador)
    // Puede venir en el body (útil para tests), sino se calcula usando porcentaje en env COMISION_VENDEDOR_PERCENT (por defecto 5%)
    const sellerPercent = Number(process.env.COMISION_VENDEDOR_PERCENT || 5);
    let comision_vendedor = req.body.comision_vendedor ? Number(req.body.comision_vendedor) : Math.round(precio_bruto * (sellerPercent / 100));
    if (!Number.isFinite(comision_vendedor)) comision_vendedor = Math.round(precio_bruto * (sellerPercent / 100));

    // Total neto: preferir el valor enviado, sino sumar
    let total = req.body.total ? Number(req.body.total) : Math.round(precio_bruto + comision_servicio + pago_reparto);
    if (!Number.isFinite(total)) total = Math.round(precio_bruto + comision_servicio + pago_reparto);

    // Validación de consistencia: la suma de las partes debe coincidir con el total
    const sumaPartes = Math.round(precio_bruto + comision_servicio + pago_reparto);
    if (sumaPartes !== Math.round(total)) {
      await t.rollback();
      return res.status(400).json({
        message: 'Inconsistencia en montos enviados',
        detalle: {
          precio_bruto: Math.round(precio_bruto),
          comision_servicio: Math.round(comision_servicio),
          pago_reparto: Math.round(pago_reparto),
          total_enviado: Math.round(total),
          suma_partes: sumaPartes
        }
      });
    }

    // Preparar ruta del comprobante si se subió archivo
    let rutaComprobante = null;
    if (req.file) {
      rutaComprobante = `uploads/comprobantes/${req.file.filename}`;
      console.log('✅ Comprobante guardado en:', rutaComprobante);
    }

    // Crear pedido con TODOS los datos incluyendo desglose de montos y comprobante
    const pedido = await db.Pedido.create(
      {
        direccion: direccion || null,
        latitud: latitud || null,
        longitud: longitud || null,
        precio_bruto: Math.round(precio_bruto),
        comision_servicio: Math.round(comision_servicio),
        comision_vendedor: Math.round(comision_vendedor),
        pago_reparto: Math.round(pago_reparto),
        total: Math.round(total),
        estado: "pendiente",
        comprobante_pago: rutaComprobante,
        pago_confirmado: false, // El admin debe confirmar
        fecha_confirmacion_pago: null
      },
      { transaction: t }
    );

    console.log('✅ Pedido creado:', pedido.id_pedido);

    // Insertar detalle de productos
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

    // Vincular vendedores
    const vendedorRows = Array.from(vendedoresSet).map(id_vendedor => ({
      id_pedido: pedido.id_pedido,
      id_usuario: id_vendedor
    }));

    if (vendedorRows.length > 0) {
      await db.pedido_vendedor.bulkCreate(vendedorRows, { transaction: t });
    }

    // Actualizar stock
    for (const item of items) {
      await db.Producto.decrement("stock", {
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



    // ------ FALTA CREAR NOTIFICACIONES PARA EL ADMIN --------



    // Obtener pedido completo para respuesta
    const pedidoCompleto = await db.Pedido.findByPk(pedido.id_pedido, {
      include: [
        {
          model: db.Producto,
          include: [
            {
              model: db.Categoria,
              attributes: ["nombre"]
            }
          ],
          through: { attributes: ["cantidad", "precio_unitario"] }
        },
        { model: db.Usuario, as: "Comprador", through: { attributes: [] } },
        { model: db.Usuario, as: "Vendedor", through: { attributes: [] } }
      ]
    });

    return res.status(201).json({
      success: true,
      message: rutaComprobante
        ? 'Pedido creado exitosamente con comprobante de pago'
        : 'Pedido creado exitosamente',
      pedido: pedidoCompleto,
      id_pedido: pedido.id_pedido,
      total: pedido.total,
      tiene_comprobante: !!rutaComprobante
    });

  } catch (error) {
    await t.rollback();

    // Eliminar archivo si se subió pero hubo error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Archivo eliminado por error en transacción');
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
    }

    console.error("❌ Error al crear pedido:", error);
    return res.status(500).json({
      message: "Error al crear pedido",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
        ,
        // (opcional) repartidor asignado (si existe)
        {
          model: db.Usuario,
          as: "Repartidor",
          through: { attributes: [] },
          required: false,
          attributes: ['id_usuario', 'nombre']
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
        id_comprador: id_usuario,
        estado: estadoMap[pedido.estado] || pedido.estado,
        fecha: new Date(pedido.fecha_creacion).toLocaleDateString('es-CL'),
        // Monto desglosado (si el modelo lo tiene, usarlo; si no, calcular fallback)
        subtotal: pedido.precio_bruto || items.reduce((s, it) => s + it.subtotal, 0),
        comision: pedido.comision_servicio || (pedido.total ? (pedido.total - (pedido.precio_bruto || items.reduce((s, it) => s + it.subtotal, 0))) : 0),
        precio_reparto: pedido.pago_reparto || 0,
        total: pedido.total,
        tiene_repartidor: pedido.tiene_repartidor,
        items: items,
        repartidor: pedido.Repartidor && pedido.Repartidor[0] ? { id: pedido.Repartidor[0].id_usuario, nombre: pedido.Repartidor[0].nombre } : null,
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


// Calificar pedido (vendedor y/o repartidor)
export const calificarPedido = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id_pedido, id_comprador, calificaciones } = req.body;

    if (!id_pedido || !id_comprador || !calificaciones) {
      await t.rollback();
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Verificar que el pedido existe y está entregado
    const pedido = await db.Pedido.findByPk(id_pedido, {
      include: [
        {
          model: db.Usuario,
          as: 'Vendedor',
          through: { attributes: [] }
        },
        {
          model: db.Usuario,
          as: 'Repartidor',
          through: { attributes: [] }
        }
      ],
      transaction: t
    });

    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (pedido.estado !== 'entregado') {
      await t.rollback();
      return res.status(400).json({ message: "Solo se pueden calificar pedidos entregados" });
    }

    const valoracionesCreadas = [];

    // Crear calificación para el vendedor (si se proporcionó)
    if (calificaciones.vendedor && calificaciones.vendedor.calificacion > 0 && pedido.Vendedor?.[0]) {
      // Verificar que no haya calificado antes al vendedor
      const calificacionExistente = await db.Valoracion.findOne({
        where: {
          id_comprador: id_comprador,
          id_usuario_evaluado: pedido.Vendedor[0].id_usuario,
          tipo: 'comprador_a_vendedor'
        },
        transaction: t
      });

      if (!calificacionExistente) {
        const valoracionVendedor = await db.Valoracion.create({
          id_comprador: id_comprador,
          id_usuario_evaluado: pedido.Vendedor[0].id_usuario,
          tipo: 'comprador_a_vendedor',
          calificacion: calificaciones.vendedor.calificacion,
          comentario: calificaciones.vendedor.comentario || null,
          fecha: new Date()
        }, { transaction: t });

        valoracionesCreadas.push(valoracionVendedor);
      }
    }

    // Crear calificación para el repartidor (si se proporcionó)
    if (calificaciones.repartidor && calificaciones.repartidor.calificacion > 0 && pedido.Repartidor?.[0]) {
      // Verificar que no haya calificado antes al repartidor
      const calificacionExistente = await db.Valoracion.findOne({
        where: {
          id_comprador: id_comprador,
          id_usuario_evaluado: pedido.Repartidor[0].id_usuario,
          tipo: 'comprador_a_repartidor'
        },
        transaction: t
      });

      if (!calificacionExistente) {
        const valoracionRepartidor = await db.Valoracion.create({
          id_comprador: id_comprador,
          id_usuario_evaluado: pedido.Repartidor[0].id_usuario,
          tipo: 'comprador_a_repartidor',
          calificacion: calificaciones.repartidor.calificacion,
          comentario: calificaciones.repartidor.comentario || null,
          fecha: new Date()
        }, { transaction: t });

        valoracionesCreadas.push(valoracionRepartidor);
      }
    }

    await t.commit();

    res.json({
      message: "Calificaciones guardadas exitosamente",
      valoraciones: valoracionesCreadas
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al calificar pedido:', error);
    res.status(500).json({
      message: "Error al guardar calificaciones",
      error: error.message
    });
  }
};