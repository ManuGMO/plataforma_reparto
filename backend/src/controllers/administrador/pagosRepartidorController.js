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

    // Helper: formatea fecha a YYYY-MM-DD para keys/queries
    const formatISO = (d) => {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    // Helper: formatea fecha a MM-DD para mostrar sin año
    const formatMMDD = (d) => {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${mm}-${dd}`;
    };

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

      // Agrupar por semana (Lunes-Viernes)
      const weeksMap = new Map();

      pedidosValidos.forEach(p => {
        const fecha = new Date(p.Pedido.fecha_creacion);
        // calcular lunes de esa semana
        const day = fecha.getDay(); // 0 Domingo .. 6 Sábado
        const diffToMonday = (day + 6) % 7;
        const monday = new Date(fecha);
        monday.setDate(fecha.getDate() - diffToMonday);
        monday.setHours(0,0,0,0);
        // ahora incluimos sábado y domingo: semana Lunes-Domingo -> sunday = monday + 6
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);

        const key = formatISO(monday); // key por semana (ISO)

        if (!weeksMap.has(key)) {
          weeksMap.set(key, { monday, sunday, pedidos: [] });
        }
        weeksMap.get(key).pedidos.push(p);
      });

      // Para cada semana calcular totales
      for (const [weekStart, { monday, sunday, pedidos }] of weeksMap.entries()) {
        const totalEntregas = pedidos.length;
        const brutoFloat = pedidos.reduce((s, p) => s + Number(p.Pedido.pago_reparto || 0), 0);
        // montos como enteros redondeados
        const bruto = Math.round(brutoFloat);
        const retenciones = Math.round(bruto * 0.145);
        const neto = bruto - retenciones;
        // comprobar si ya existe una liquidación para este usuario y weekStart
        const existeLiquidacion = await db.Boleta_Honorarios.findOne({
          where: { id_usuario: rep.id_usuario, periodo: formatISO(monday), estado: 'pagado' }
        });

        resumen.push({
          id: rep.id_usuario,
          driver: rep.nombre,
          email: rep.correo,
          weekStart: formatISO(monday),
          weekEnd: formatISO(sunday),
          // formato estético pedido: (DD - MM) - (DD - MM)
          period: `(${String(monday.getDate()).padStart(2,'0')} - ${String(monday.getMonth()+1).padStart(2,'0')}) - (${String(sunday.getDate()).padStart(2,'0')} - ${String(sunday.getMonth()+1).padStart(2,'0')})`,
          deliveries: totalEntregas,
          grossAmount: bruto,
          retentions: retenciones,
          netAmount: neto,
          status: existeLiquidacion ? 'paid' : (totalEntregas > 0 ? 'pending' : 'paid')
        });
      }
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
    const { weekStart } = req.query || {};
    const pedidoIncludeWhere = { estado: { [Op.in]: ['entregado', 'en_reparto', 'listo_para_recoger', 'aceptado'] } };

    if (weekStart) {
      const monday = new Date(weekStart);
      monday.setHours(0,0,0,0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);
      pedidoIncludeWhere.fecha_creacion = { [Op.between]: [monday, sunday] };
    }

    const pedidos = await db.pedido_repartidor.findAll({
      where: { id_usuario: id_repartidor },
      include: [
        {
          model: db.Pedido,
          as: 'Pedido',
          attributes: ['id_pedido', 'pago_reparto', 'estado', 'fecha_creacion', 'direccion'],
          where: pedidoIncludeWhere,
          required: true
        }
      ],
      order: [[{ model: db.Pedido, as: 'Pedido' }, 'fecha_creacion', 'DESC']]
    });

    const detalle = pedidos.map(p => ({
      id_pedido: p.id_pedido,
      fecha_pedido: p.Pedido.fecha_creacion,
      pago_reparto: Math.round(Number(p.Pedido.pago_reparto || 0)),
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
    // Podemos recibir un weekStart (YYYY-MM-DD) para crear la liquidación de esa semana
    const { weekStart } = req.body || req.query || {};

    let wherePedido = { id_usuario: id_repartidor };

    // obtener pedidos con estados válidos
    const includePedido = { model: db.Pedido, as: 'Pedido', where: { estado: { [Op.in]: ['entregado', 'en_reparto', 'listo_para_recoger', 'aceptado'] } } };

    if (weekStart) {
      // parse weekStart y definir rango Lunes-Domingo
      const monday = new Date(weekStart);
      monday.setHours(0,0,0,0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);
      includePedido.where.fecha_creacion = { [Op.between]: [monday, sunday] };
    }

    const pedidos = await db.pedido_repartidor.findAll({
      where: wherePedido,
      include: [ includePedido ]
    });

  const brutoFloat = pedidos.reduce((s, p) => s + Number(p.Pedido?.pago_reparto || 0), 0);
  const bruto = Math.round(brutoFloat);
  const retenciones = Math.round(bruto * 0.145);
  const neto = bruto - retenciones;

  const periodoTexto = weekStart ? `${new Date(weekStart).toISOString().slice(5,10)} - ${new Date(new Date(weekStart).setDate(new Date(weekStart).getDate()+6)).toISOString().slice(5,10)}` : 'último período';

    // Si se pasó weekStart, usarlo como identificador de periodo (ISO)
    if (weekStart) {
      // verificar existencia
  const existente = await db.Boleta_Honorarios.findOne({ where: { id_usuario: id_repartidor, periodo: weekStart, estado: 'pagado' } });
      if (existente) {
        await t.rollback();
        return res.status(409).json({ message: 'La semana ya está marcada como pagada' });
      }
      const nueva = await db.Boleta_Honorarios.create({
        id_usuario: id_repartidor,
        tipo: 'repartidor',
        periodo: weekStart,
        total: neto,
        estado: 'pagado'
      }, { transaction: t });

  await t.commit();
  return res.json({ message: 'Pagos marcados como pagados', boleta: nueva });
    }

    // si no se especificó weekStart, crear una liquidación genérica
    const nueva = await db.Boleta_Honorarios.create({
      id_usuario: id_repartidor,
      tipo: 'repartidor',
      periodo: periodoTexto,
      total: neto,
      estado: 'pagado'
    }, { transaction: t });

  await t.commit();
+
+
+    res.json({ message: 'Pagos marcados como pagados', boleta: nueva });
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    console.error('Error marcar pagos repartidor:', error);
    res.status(500).json({ message: 'Error al marcar pagos como pagados', error: error.message });
  }
};
