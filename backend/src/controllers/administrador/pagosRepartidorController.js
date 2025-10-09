import { Op } from 'sequelize';
import db from '../../models/indexModels.js';

// Obtener resumen de pagos para repartidores
export const obtenerPagosRepartidores = async (req, res) => {

    console.log('LLEGUE AL CONTROLLER');

  try {
    const { estado } = req.query;

    const rolRepartidor = await db.Rol.findOne({ where: { nombreRol: 'repartidor' } });
    if (!rolRepartidor) return res.status(404).json({ message: 'Rol repartidor no encontrado' });

    const repartidores = await db.Usuario.findAll({
      include: [
        {
          model: db.Rol,
          through: { model: db.Usuario_Rol, attributes: [] },
          where: { id_rol: rolRepartidor.id_rol },
          attributes: []
        }
      ],
      attributes: ['id_usuario', 'nombre', 'correo']
    });

    const resumen = [];

    for (const rep of repartidores) {
      const pedidosRepartidor = await db.pedido_repartidor.findAll({
        where: { id_usuario: rep.id_usuario },
        include: [
          {
            model: db.Pedido,
            as: 'Pedido',
            attributes: ['id_pedido', 'pago_reparto', 'estado', 'fecha_creacion'],
            where: {
              estado: { [Op.in]: ['entregado', 'en_reparto', 'listo_para_recoger', 'aceptado'] }
            },
            required: false
          }
        ],
        attributes: ['id_pedido']
      });

      const pedidosValidos = pedidosRepartidor.filter(p => p.Pedido !== null);

      if (estado === 'pending' && pedidosValidos.length === 0) continue;

      const totalEntregas = pedidosValidos.length;
      const bruto = pedidosValidos.reduce((s, p) => s + parseFloat(p.Pedido.pago_reparto || 0), 0);
      const retenciones = Math.round(bruto * 0.145); // 14.5% redondeado a entero
      const neto = bruto - retenciones;

      resumen.push({
        id: rep.id_usuario,
        driver: rep.nombre,
        email: rep.correo,
        period: 'último período',
        deliveries: totalEntregas,
        grossAmount: bruto,
        retentions: retenciones,
        netAmount: neto,
        status: totalEntregas > 0 ? 'pending' : 'paid'
      });
    }

    // ordenar por pendientes (pendings first)
    resumen.sort((a, b) => (b.deliveries - a.deliveries));

    res.json(resumen);
  } catch (error) {
    console.error('Error obtener pagos repartidores:', error);
    res.status(500).json({ message: 'Error al obtener pagos de repartidores', error: error.message });
  }
};

// Obtener detalle de pagos para un repartidor
export const obtenerDetallePagosRepartidor = async (req, res) => {
  try {
    const { id_repartidor } = req.params;

    const pedidos = await db.pedido_repartidor.findAll({
      where: { id_usuario: id_repartidor },
      include: [
        {
          model: db.Pedido,
          as: 'Pedido',
          attributes: ['id_pedido', 'pago_reparto', 'estado', 'fecha_creacion', 'direccion'],
          where: { estado: { [Op.in]: ['entregado', 'en_reparto', 'listo_para_recoger', 'aceptado'] } },
          required: true
        }
      ],
      order: [[{ model: db.Pedido, as: 'Pedido' }, 'fecha_creacion', 'DESC']]
    });

    const detalle = pedidos.map(p => ({
      id_pedido: p.id_pedido,
      fecha_pedido: p.Pedido.fecha_creacion,
      pago_reparto: p.Pedido.pago_reparto || 0,
      estado_pedido: p.Pedido.estado,
      direccion: p.Pedido.direccion
    }));

    res.json(detalle);
  } catch (error) {
    console.error('Error obtener detalle repartidor:', error);
    res.status(500).json({ message: 'Error al obtener detalle de repartidor', error: error.message });
  }
};

// Marcar pagos como pagados (simple: crear una Liquidacion o actualizar flag)
export const marcarPagosComoPagados = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id_repartidor } = req.params;

    // Como no hay campo 'estado_pago' en pedido_repartidor, vamos a crear una Liquidacion de ejemplo
    const pedidos = await db.pedido_repartidor.findAll({
      where: { id_usuario: id_repartidor },
      include: [{ model: db.Pedido, as: 'Pedido', where: { estado: { [Op.in]: ['entregado', 'en_reparto', 'listo_para_recoger', 'aceptado'] } } }]
    });

    const bruto = pedidos.reduce((s, p) => s + parseFloat(p.Pedido.pago_reparto || 0), 0);
    const retenciones = bruto * 0.145;
    const neto = bruto - retenciones;

    const nueva = await db.Liquidacion.create({
      id_usuario: id_repartidor,
      tipo: 'repartidor',
      periodo: 'último período',
      total: neto,
      estado: 'pagado'
    }, { transaction: t });

    await t.commit();

    res.json({ message: 'Pagos marcados como pagados', liquidacion: nueva });
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    console.error('Error marcar pagos repartidor:', error);
    res.status(500).json({ message: 'Error al marcar pagos como pagados', error: error.message });
  }
};
