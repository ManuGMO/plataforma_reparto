import db from "../../models/indexModels.js";

export const obtenerComprobantes = async (req, res) => {
  try {
    const { estado } = req.query; // 'pending', 'approved', 'rejected', 'all'
    
    let whereClause = {};
    
    if (estado === 'pending') {
      whereClause = {
        comprobante_pago: { [db.Sequelize.Op.ne]: null },
        pago_confirmado: false
      };
    } else if (estado === 'approved') {
      whereClause = {
        pago_confirmado: true
      };
    } else if (estado === 'rejected') {
      whereClause = {
        comprobante_pago: { [db.Sequelize.Op.ne]: null },
        pago_confirmado: false,
        estado: 'cancelado' // Asumiendo que rechazado = cancelado
      };
    } else if (estado === 'all') {
      whereClause = {
        comprobante_pago: { [db.Sequelize.Op.ne]: null }
      };
    }

    const pedidos = await db.Pedido.findAll({
      where: whereClause,
      include: [
        {
          model: db.Usuario,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre'],
          through: { attributes: [] }
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    // Formatear respuesta
    const comprobantes = pedidos.map(pedido => ({
      id_pedido: pedido.id_pedido,
      total: pedido.total,
      estado: pedido.estado,
      direccion: pedido.direccion,
      comprobante_pago: pedido.comprobante_pago,
      pago_confirmado: pedido.pago_confirmado,
      fecha_creacion: pedido.fecha_creacion,
      fecha_confirmacion_pago: pedido.fecha_confirmacion_pago,
      comprador_nombre: pedido.Comprador?.[0]?.nombre || null
    }));

    res.json(comprobantes);
  } catch (error) {
    console.error('Error al obtener comprobantes:', error);
    res.status(500).json({ message: "Error al obtener comprobantes" });
  }
};

export const validarComprobante = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const { id_pedido } = req.params;
    const { accion } = req.body; // 'aprobar' o 'rechazar'

    if (!['aprobar', 'rechazar'].includes(accion)) {
      await t.rollback();
      return res.status(400).json({ message: "Acción inválida. Use 'aprobar' o 'rechazar'" });
    }

    const pedido = await db.Pedido.findByPk(id_pedido, { transaction: t });

    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (!pedido.comprobante_pago) {
      await t.rollback();
      return res.status(400).json({ message: "Este pedido no tiene comprobante" });
    }

    if (accion === 'aprobar') {
      await pedido.update({
        pago_confirmado: true,
        fecha_confirmacion_pago: new Date()
      }, { transaction: t });
    } else {
      await pedido.update({
        estado: 'cancelado',
        pago_confirmado: false
      }, { transaction: t });
    }

    await t.commit();

    res.json({
      message: accion === 'aprobar' ? "Comprobante aprobado correctamente" : "Comprobante rechazado",
      pedido: {
        id_pedido: pedido.id_pedido,
        pago_confirmado: pedido.pago_confirmado,
        estado: pedido.estado,
        fecha_confirmacion_pago: pedido.fecha_confirmacion_pago
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al validar comprobante:', error);
    res.status(500).json({ message: "Error al validar comprobante" });
  }
};