import db from "../../models/indexModels.js";

const { sequelize, Pedido, Usuario, Producto, pedido_repartidor, Producto_Pedido, pedido_comprador, pedido_vendedor } = db;

export const getPedidos = async (req, res) => {
  try {
    const { id } = req.params;
   
    const pedidos = await db.pedido_vendedor.findAll({
      where: { id_usuario: id },
      include: [
        {
          model: db.Pedido,
          as: 'Pedido',
          include: [
            {
              model: db.Usuario,
              through: db.pedido_comprador,
              as: "Comprador",
              attributes: ["id_usuario", "nombre"]
            },
            {
              model: db.Producto.scope('conEliminados'),
              through: {
                model: db.Producto_Pedido,
                attributes: ['cantidad', 'precio_unitario']
              },
              attributes: ["id_producto", "nombre", "activo"]
            }
          ]
        }
      ]
    });

    const pedidosTransformados = pedidos.map((pedidoVendedor) => {
      const pedido = pedidoVendedor.Pedido;
      
      if (!pedido) {
        console.warn('Pedido no encontrado para pedidoVendedor:', pedidoVendedor.id);
        return null;
      }
     
      return {
        id_pedido: pedido.id_pedido,
        cliente: pedido.Comprador?.[0]?.nombre || "Cliente no disponible",
        estado: pedido.estado,
        fecha_creacion: pedido.fecha_creacion,
        total: pedido.total,
        direccion: pedido.direccion,
        latitud: pedido.latitud,
        longitud: pedido.longitud,
        estado_pago: pedidoVendedor.estado_pago,
        tiene_repartidor: pedido.tiene_repartidor,
        comprobante_pago: pedido.comprobante_pago,
        pago_confirmado: pedido.pago_confirmado,
        fecha_confirmacion_pago: pedido.fecha_confirmacion_pago,
        items: pedido.Productos.map((producto) => ({
          nombre: producto.nombre,
          cantidad: producto.Producto_Pedido.cantidad,
          precio_unitario: producto.Producto_Pedido.precio_unitario,
          producto_eliminado: !producto.activo
        })),
      };
    }).filter(pedido => pedido !== null);

    console.log("Pedidos encontrados: ", pedidosTransformados.length);
    res.json(pedidosTransformados);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({
      error: "Error al obtener pedidos",
      details: error.message
    });
  }
};

// NUEVO ENDPOINT: Obtener detalles completos de un pedido específico
export const getPedidoDetalle = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { vendedorId } = req.query; // Opcional para verificar permisos

    const pedido = await db.Pedido.findByPk(pedidoId, {
      include: [
        {
          model: db.Usuario,
          through: db.pedido_comprador,
          as: "Comprador",
          attributes: ["id_usuario", "nombre"]
        },
        {
          model: db.Usuario,
          through: db.pedido_vendedor,
          as: "Vendedor",
          attributes: ["id_usuario", "nombre"]
        },
        {
          model: db.Usuario,
          through: db.pedido_repartidor,
          as: "Repartidor",
          attributes: ["id_usuario", "nombre"]
        },
        {
          model: db.Producto.scope('conEliminados'),
          through: {
            model: db.Producto_Pedido,
            attributes: ['cantidad', 'precio_unitario']
          },
          attributes: ["id_producto", "nombre", "precio", "activo"]
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Verificar que el vendedor tiene acceso a este pedido (opcional)
    if (vendedorId) {
      const esVendedor = pedido.Vendedor.some(v => v.id_usuario == vendedorId);
      if (!esVendedor) {
        return res.status(403).json({ error: "No tienes acceso a este pedido" });
      }
    }

    const pedidoDetallado = {
      id_pedido: pedido.id_pedido,
      estado: pedido.estado,
      fecha_creacion: pedido.fecha_creacion,
      fecha_entrega: pedido.fecha_entrega,
      estado_anterior: pedido.estado_anterior,
      fecha_ultimo_cambio_estado: pedido.fecha_ultimo_cambio_estado,
      hora_entrega: pedido.hora_entrega,
      total: pedido.total,
      direccion: pedido.direccion,
      latitud: pedido.latitud,
      longitud: pedido.longitud,
      tiene_repartidor: pedido.tiene_repartidor,
      
      // Información de pago
      comprobante_pago: pedido.comprobante_pago,
      pago_confirmado: pedido.pago_confirmado,
      fecha_confirmacion_pago: pedido.fecha_confirmacion_pago,
      
      // Comprador
      comprador: pedido.Comprador?.[0] ? {
        id: pedido.Comprador[0].id_usuario,
        nombre: pedido.Comprador[0].nombre
      } : null,
      
      // Repartidor
      repartidor: pedido.Repartidor?.[0] ? {
        id: pedido.Repartidor[0].id_usuario,
        nombre: pedido.Repartidor[0].nombre
      } : null,
      
      // Productos
      productos: pedido.Productos.map(producto => ({
        id: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: producto.Producto_Pedido.cantidad,
        precio_unitario: producto.Producto_Pedido.precio_unitario,
        subtotal: producto.Producto_Pedido.cantidad * producto.Producto_Pedido.precio_unitario,
        activo: producto.activo,
        eliminado: !producto.activo
      }))
    };

    res.json(pedidoDetallado);

  } catch (error) {
    console.error("Error al obtener detalle del pedido:", error);
    res.status(500).json({
      error: "Error al obtener detalle del pedido",
      details: error.message
    });
  }
};

export const estadoPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
 
  try {
    const { id } = req.params;
    const { estado, id_vendedor } = req.body;
    
    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario']
        }
      ],
      transaction
    });

    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Pedido no encontrado"
      });
    }

    const vendedorAsignado = pedido.Vendedor.find(v => v.id_usuario == id_vendedor);
    if (!vendedorAsignado && id_vendedor) {
      await transaction.rollback();
      return res.status(403).json({
        error: 'No tienes permisos para actualizar este pedido'
      });
    }

    const transicionesValidasVendedor = {
      'pendiente': ['aceptado', 'rechazado'],
      'aceptado': ['listo_para_recoger', 'cancelado'],
      'listo_para_recoger': ['cancelado'],
      'repartidor_asignado': ['cancelado'],
      'en_reparto': [],
      'entregado': [],
      'cancelado': [],
      'rechazado': []
    };

    if (!transicionesValidasVendedor[pedido.estado]?.includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({
        error: `No se puede cambiar de estado ${pedido.estado} a ${estado}`,
        transiciones_permitidas: transicionesValidasVendedor[pedido.estado] || []
      });
    }

    await pedido.update({ estado }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Estado actualizado correctamente",
      pedido: {
        id_pedido: pedido.id_pedido,
        estado: estado
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Error al actualizar pedido:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: error.message
    });
  }
};

export const marcarListoParaRecoger = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { pedidoId } = req.params;
    const { id_vendedor } = req.body;

    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario']
        }
      ],
      transaction
    });

    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Pedido no encontrado' 
      });
    }

    // Verificar que el vendedor es el dueño del pedido
    const vendedorAsignado = pedido.Vendedor.find(v => v.id_usuario == id_vendedor);
    if (!vendedorAsignado) {
      await transaction.rollback();
      return res.status(403).json({ 
        error: 'No tienes permisos para actualizar este pedido' 
      });
    }

    // Verificar que el pedido está en estado aceptado
    if (pedido.estado !== 'aceptado') {
      await transaction.rollback();
      return res.status(400).json({ 
        error: `No se puede marcar como listo. Estado actual: ${pedido.estado}` 
      });
    }

    // Actualizar estado
    await pedido.update({ 
      estado: 'listo_para_recoger' 
    }, { transaction });

    await transaction.commit();

    res.json({ 
      message: 'Pedido marcado como listo para recoger',
      pedido: {
        id_pedido: pedido.id_pedido,
        estado: 'listo_para_recoger'
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al marcar pedido como listo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

