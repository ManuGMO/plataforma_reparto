import db from "../../models/indexModels.js";
import { Op } from "sequelize";

export const obtenerEstadisticasDashboard = async (req, res) => {
  try {
    // 1. Usuarios Activos
    const usuariosActivos = await db.Usuario.count({
      where: { estado: 'activo' }
    });

    // 2. Total de Usuarios
    const totalUsuarios = await db.Usuario.count();

    // 3. Obtener todos los pedidos
    const todosLosPedidos = await db.Pedido.findAll({
      attributes: ['id_pedido', 'total', 'estado', 'fecha_creacion']
    });

    // 4. Ingresos Totales (suma de todos los pedidos)
    const ingresosTotales = todosLosPedidos.reduce((sum, pedido) => {
      return sum + parseFloat(pedido.total || 0);
    }, 0);

    // 5. Comisiones Totales (10% de los ingresos)
    const comisionesTotales = ingresosTotales * 0.1;

    // 6. Pedidos de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const pedidosHoy = await db.Pedido.count({
      where: {
        fecha_creacion: {
          [Op.gte]: hoy,
          [Op.lt]: mañana
        }
      }
    });

    // 7. Total de pedidos
    const totalPedidos = todosLosPedidos.length;

    // 8. Pedidos entregados
    const pedidosEntregados = todosLosPedidos.filter(p => p.estado === 'entregado').length;

    // 9. Pedidos pendientes (no entregados ni cancelados)
    const pedidosPendientes = todosLosPedidos.filter(p => 
      !['entregado', 'cancelado', 'rechazado'].includes(p.estado)
    ).length;

    res.json({
      usuariosActivos,
      totalUsuarios,
      ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
      pedidosHoy,
      comisionesTotales: parseFloat(comisionesTotales.toFixed(2)),
      totalPedidos,
      pedidosEntregados,
      pedidosPendientes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ 
      message: "Error al obtener estadísticas",
      error: error.message 
    });
  }
};

export const obtenerActividadReciente = async (req, res) => {
  try {
    const actividades = [];

    // Fecha de hoy (00:00) y mañana (límite)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Pedidos creados hoy (limitados a 5)
    const pedidosRecientes = await db.Pedido.findAll({
      attributes: ['id_pedido', 'estado', 'fecha_creacion', 'total'],
      where: {
        fecha_creacion: {
          [Op.gte]: hoy,
          [Op.lt]: manana
        }
      },
      order: [['fecha_creacion', 'DESC']],
      limit: 5
    });

    pedidosRecientes.forEach(pedido => {
      const minutosTranscurridos = Math.floor((new Date() - new Date(pedido.fecha_creacion)) / 60000);
      let tiempoTexto;
      
      if (minutosTranscurridos < 1) {
        tiempoTexto = 'Hace un momento';
      } else if (minutosTranscurridos < 60) {
        tiempoTexto = `Hace ${minutosTranscurridos} minuto${minutosTranscurridos > 1 ? 's' : ''}`;
      } else {
        const horas = Math.floor(minutosTranscurridos / 60);
        tiempoTexto = `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
      }

      actividades.push({
        tipo: 'pedido',
        icon: '📦',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600',
        texto: `Nuevo pedido #${pedido.id_pedido} - $${pedido.total}`,
        tiempo: tiempoTexto
      });
    });

    // Usuarios registrados hoy (limitados a 3)
    const usuariosRecientes = await db.Usuario.findAll({
      attributes: ['id_usuario', 'nombre', 'fecha_registro'],
      where: {
        fecha_registro: {
          [Op.gte]: hoy,
          [Op.lt]: manana
        }
      },
      order: [['fecha_registro', 'DESC']],
      limit: 3
    });

    usuariosRecientes.forEach(usuario => {
      const minutosTranscurridos = Math.floor((new Date() - new Date(usuario.fecha_registro)) / 60000);
      let tiempoTexto;
      
      if (minutosTranscurridos < 1) {
        tiempoTexto = 'Hace un momento';
      } else if (minutosTranscurridos < 60) {
        tiempoTexto = `Hace ${minutosTranscurridos} minuto${minutosTranscurridos > 1 ? 's' : ''}`;
      } else {
        const horas = Math.floor(minutosTranscurridos / 60);
        tiempoTexto = `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
      }

      actividades.push({
        tipo: 'usuario',
        icon: '👤',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        texto: `Nuevo usuario: ${usuario.nombre}`,
        tiempo: tiempoTexto
      });
    });

    // Ordenar todas las actividades por tiempo
    actividades.sort((a, b) => {
      // Extraer números de las cadenas de tiempo para ordenar
      const getMinutes = (texto) => {
        if (texto.includes('momento')) return 0;
        const match = texto.match(/\d+/);
        if (!match) return 0;
        const num = parseInt(match[0]);
        return texto.includes('hora') ? num * 60 : num;
      };
      return getMinutes(a.tiempo) - getMinutes(b.tiempo);
    });

    // Limitar a las 10 actividades más recientes
    const actividadesLimitadas = actividades.slice(0, 10);

    res.json(actividadesLimitadas);
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    res.status(500).json({ 
      message: "Error al obtener actividad reciente",
      error: error.message 
    });
  }
};

export const obtenerResumenDiario = async (req, res) => {
  try {
    // Fecha solicitada o hoy (formato YYYY-MM-DD opcional)
    const { date } = req.query;
    const fecha = date ? new Date(date) : new Date();
    fecha.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setDate(fechaFin.getDate() + 1);

    // Tomamos pedidos entregados cuya fecha_entrega esté dentro del día
    const pedidos = await db.Pedido.findAll({
      where: {
        estado: 'entregado',
        fecha_entrega: {
          [Op.gte]: fecha,
          [Op.lt]: fechaFin
        }
      },
      attributes: ['id_pedido', 'precio_bruto', 'comision_servicio', 'comision_vendedor', 'pago_reparto', 'total']
    });

    const totalPedidos = pedidos.length;
    const bruto = pedidos.reduce((s, p) => s + Number(p.precio_bruto || 0), 0);
    const totalComisionServicio = pedidos.reduce((s, p) => s + Number(p.comision_servicio || 0), 0);
    const totalComisionVendedor = pedidos.reduce((s, p) => s + Number(p.comision_vendedor || 0), 0);
    const totalPagoRepartidores = pedidos.reduce((s, p) => s + Number(p.pago_reparto || 0), 0);
    const ingresosTotales = pedidos.reduce((s, p) => s + Number(p.total || 0), 0);

    const gananciaNeta = ingresosTotales - totalPagoRepartidores - totalComisionVendedor - totalComisionServicio;

    res.json({
      date: fecha.toISOString().slice(0,10),
      totalPedidos,
      bruto: Number(bruto.toFixed(2)),
      ingresosTotales: Number(ingresosTotales.toFixed(2)),
      totalComisionServicio: Number(totalComisionServicio.toFixed(2)),
      totalComisionVendedor: Number(totalComisionVendedor.toFixed(2)),
      totalPagoRepartidores: Number(totalPagoRepartidores.toFixed(2)),
      gananciaNeta: Number(gananciaNeta.toFixed(2)),
      updatedAt: new Date(fecha).toISOString() // fecha de referencia (00:00 del día)
    });
  } catch (error) {
    console.error('Error al obtener resumen diario:', error);
    res.status(500).json({ message: 'Error al obtener resumen diario', error: error.message });
  }
};