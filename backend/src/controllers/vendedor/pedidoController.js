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
              attributes: ["id_producto", "nombre", "activo", "id_usuario"]
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

      const itemsFiltrados = pedido.Productos
        .filter((producto) => producto.id_usuario == id) // Filtrar solo los productos del vendedor
        .map((producto) => ({
          nombre: producto.nombre,
          cantidad: producto.Producto_Pedido.cantidad,
          precio_unitario: producto.Producto_Pedido.precio_unitario,
          producto_eliminado: !producto.activo
        }));

      return {
        id_pedido: pedido.id_pedido,
        cliente: pedido.Comprador?.[0]?.nombre || "Cliente no disponible",
        estado: pedidoVendedor.estado_pedido || pedido.estado, // Usar estado del vendedor
        fecha_creacion: pedido.fecha_creacion,
        total: itemsFiltrados.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0),
        direccion: pedido.direccion,
        latitud: pedido.latitud,
        longitud: pedido.longitud,
        estado_pago: pedidoVendedor.estado_pago,
        tiene_repartidor: pedido.tiene_repartidor,
        comprobante_pago: pedido.comprobante_pago,
        pago_confirmado: pedido.pago_confirmado,
        fecha_confirmacion_pago: pedido.fecha_confirmacion_pago,
        items: itemsFiltrados,
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
          attributes: ["id_producto", "nombre", "precio", "activo", "id_usuario"]
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

      // Productos del vendedor específico (si aplica)
      productos: pedido.Productos
        .filter(producto => !vendedorId || producto.id_usuario == vendedorId)
        .map(producto => ({
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

    // Si se consulta para un vendedor, reemplazar estado por estado del vendedor y recalcular total
    if (vendedorId) {
      const vendedorInfo = pedido.Vendedor.find(v => v.id_usuario == vendedorId);
      if (vendedorInfo && vendedorInfo.pedido_vendedor) {
        pedidoDetallado.estado = vendedorInfo.pedido_vendedor.estado_pedido || pedido.estado;
      }
      pedidoDetallado.total = pedidoDetallado.productos.reduce((acc, curr) => acc + curr.subtotal, 0);
    }

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
    console.log("Id del vendedor: ", id_vendedor);

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

    const estadoActualVendedor = vendedorAsignado?.pedido_vendedor?.estado_pedido || 'pendiente';

    if (!transicionesValidasVendedor[estadoActualVendedor]?.includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({
        error: `No se puede cambiar de estado ${estadoActualVendedor} a ${estado}`,
        transiciones_permitidas: transicionesValidasVendedor[estadoActualVendedor] || []
      });
    }

    // Actualizar el estado del vendedor específico
    await db.pedido_vendedor.update(
      { estado_pedido: estado },
      { where: { id_pedido: id, id_usuario: id_vendedor }, transaction }
    );

    // Verificar si todos los vendedores han avanzado a este mismo estado (o posterior)
    const todosVendedores = await db.pedido_vendedor.findAll({
      where: { id_pedido: id },
      transaction
    });

    const estadosRanking = ['pendiente', 'aceptado', 'listo_para_recoger', 'en_reparto', 'entregado'];
    const indexNuevoEstado = estadosRanking.indexOf(estado);

    // Si todos los vendedores están en un estado >= al nuevo estado, actualizar el global
    let todosAvanzaron = true;
    for (const pv of todosVendedores) {
      const estadoPv = (pv.id_usuario == id_vendedor) ? estado : (pv.estado_pedido || 'pendiente');

      if (estadosRanking.indexOf(estadoPv) < indexNuevoEstado && estadoPv !== 'rechazado' && estadoPv !== 'cancelado') {
        todosAvanzaron = false;
        break;
      }
    }

    if (todosAvanzaron && indexNuevoEstado > -1) {
      await pedido.update({ estado }, { transaction });
    } else if (estado === 'rechazado' || estado === 'cancelado') {
      // Si alguno rechaza/cancela, el global podría dejarse pendiente, pero por ahora no tocamos el global
      // a menos de que implementen lógica de cancelación parcial.
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Estado actualizado correctamente",
      pedido: {
        id_pedido: pedido.id_pedido,
        estado: estado // Se devuelve el estado del vendedor para que la UI se actualice
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

    const estadoActualVendedor = vendedorAsignado?.pedido_vendedor?.estado_pedido || 'pendiente';

    // Verificar que el estado del vendedor está en estado aceptado
    if (estadoActualVendedor !== 'aceptado') {
      await transaction.rollback();
      return res.status(400).json({
        error: `No se puede marcar como listo. Estado actual: ${estadoActualVendedor}`
      });
    }

    // Actualizar estado del vendedor
    await db.pedido_vendedor.update(
      { estado_pedido: 'listo_para_recoger' },
      { where: { id_pedido: pedidoId, id_usuario: id_vendedor }, transaction }
    );

    // Verificar si todos los vendedores están listos
    const todosVendedores = await db.pedido_vendedor.findAll({
      where: { id_pedido: pedidoId },
      transaction
    });

    let todosListos = true;
    for (const pv of todosVendedores) {
      const estadoPv = (pv.id_usuario == id_vendedor) ? 'listo_para_recoger' : (pv.estado_pedido || 'pendiente');

      if (estadoPv !== 'listo_para_recoger' && estadoPv !== 'en_reparto' && estadoPv !== 'entregado' && estadoPv !== 'rechazado' && estadoPv !== 'cancelado') {
        todosListos = false;
        break;
      }
    }

    if (todosListos) {
      await pedido.update({ estado: 'listo_para_recoger' }, { transaction });
    }

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

