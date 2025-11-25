import { Op } from 'sequelize';
import db from '../../models/indexModels.js';

// Obtener ganancias semanales agregadas (solo pedidos entregados)
export const obtenerGananciasSemanales = async (req, res) => {
  try {
    // Traer todos los pedidos entregados. Usar fecha_entrega para agrupar por semana
    const pedidos = await db.Pedido.findAll({
      where: { estado: 'entregado', fecha_entrega: { [Op.ne]: null } },
      attributes: ['id_pedido', 'precio_bruto', 'comision_servicio', 'comision_vendedor', 'pago_reparto', 'total', 'fecha_creacion', 'fecha_entrega'],
      order: [['fecha_entrega', 'ASC']]
    });

    // Agrupar por semana (lunes - domingo)
    const weeksMap = new Map();

    const formatISO = (d) => {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    const formatPeriod = (monday, sunday) => {
      return `(${String(monday.getDate()).padStart(2,'0')} - ${String(monday.getMonth()+1).padStart(2,'0')}) - (${String(sunday.getDate()).padStart(2,'0')} - ${String(sunday.getMonth()+1).padStart(2,'0')})`;
    };

    pedidos.forEach(p => {
      // Preferir fecha_entrega para atribuir el pedido a la semana correcta;
      // si no existe, caer a fecha_creacion (defensivo)
      const fecha = p.fecha_entrega ? new Date(p.fecha_entrega) : new Date(p.fecha_creacion);
      const day = fecha.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(fecha);
      monday.setDate(fecha.getDate() - diffToMonday);
      monday.setHours(0,0,0,0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);

      const key = formatISO(monday);
      if (!weeksMap.has(key)) {
        weeksMap.set(key, { monday, sunday, pedidos: [] });
      }
      weeksMap.get(key).pedidos.push(p);
    });

    const resumen = [];
    for (const [weekStart, { monday, sunday, pedidos }] of weeksMap.entries()) {
      const deliveries = pedidos.length;
      const totalBruto = Math.round(pedidos.reduce((s, x) => s + Number(x.precio_bruto || 0), 0));
  const totalComisionComprador = Math.round(pedidos.reduce((s, x) => s + Number(x.comision_servicio || 0), 0));
  const totalComisionVendedor = Math.round(pedidos.reduce((s, x) => s + Number(x.comision_vendedor || 0), 0));
  const totalPagoReparto = Math.round(pedidos.reduce((s, x) => s + Number(x.pago_reparto || 0), 0));
      const totalTotal = Math.round(pedidos.reduce((s, x) => s + Number(x.total || 0), 0));

      // Ganancia neta de la plataforma = comisiones cobradas 
      const platformEarnings = totalComisionComprador + totalComisionVendedor ;

      resumen.push({
        weekStart: formatISO(monday),
        weekEnd: formatISO(sunday),
        period: formatPeriod(monday, sunday),
        deliveries,
        totalBruto,
        totalComisionComprador,
        totalComisionVendedor,
        totalPagoReparto,
        totalTotal,
        platformEarnings
      });
    }

    // Orden descendente por semana (más reciente primero)
    resumen.sort((a,b) => b.weekStart.localeCompare(a.weekStart));

    res.json(resumen);
  } catch (error) {
    console.error('Error obtener ganancias semanales:', error);
    res.status(500).json({ message: 'Error al obtener ganancias semanales', error: error.message });
  }
};

// Obtener detalle de pedidos para una semana específica (weekStart = YYYY-MM-DD)
export const obtenerDetalleSemana = async (req, res) => {
  try {
    const { weekStart } = req.params;
    if (!weekStart) return res.status(400).json({ message: 'weekStart requerido' });

    const monday = new Date(weekStart);
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    const pedidos = await db.Pedido.findAll({
      where: {
        // Filtrar por fecha_entrega para que el detalle incluya pedidos entregados
        // dentro de la semana (no por fecha de creación)
        estado: 'entregado',
        fecha_entrega: { [Op.between]: [monday, sunday] }
      },
      attributes: ['id_pedido', 'fecha_creacion', 'precio_bruto', 'comision_servicio', 'comision_vendedor', 'pago_reparto', 'total', 'direccion'],
      include: [
        {
          model: db.Usuario,
          through: db.pedido_vendedor,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre']
        },
        {
          model: db.Usuario,
          through: db.pedido_comprador,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre']
        }
        ,
        {
          model: db.Usuario,
          through: db.pedido_repartidor,
          as: 'Repartidor',
          attributes: ['id_usuario', 'nombre'],
          required: false
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    const detalle = pedidos.map(p => ({
      id_pedido: p.id_pedido,
        fecha_pedido: p.fecha_entrega || p.fecha_creacion,
      precio_bruto: Math.round(Number(p.precio_bruto || 0)),
      comision_servicio: Math.round(Number(p.comision_servicio || 0)),
      comision_vendedor: Math.round(Number(p.comision_vendedor || 0)),
      pago_reparto: Math.round(Number(p.pago_reparto || 0)),
      total: Math.round(Number(p.total || 0)),
      direccion: p.direccion,
      vendedor: p.Vendedor?.[0] ? { id: p.Vendedor[0].id_usuario, nombre: p.Vendedor[0].nombre } : null,
      comprador: p.Comprador?.[0] ? { id: p.Comprador[0].id_usuario, nombre: p.Comprador[0].nombre } : null,
      repartidor: p.Repartidor?.[0] ? { id: p.Repartidor[0].id_usuario, nombre: p.Repartidor[0].nombre } : null
    }));

    res.json(detalle);
  } catch (error) {
    console.error('Error obtener detalle de semana:', error);
    res.status(500).json({ message: 'Error al obtener detalle de la semana', error: error.message });
  }
};
