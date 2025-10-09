import { Op } from "sequelize";
import db from "../../models/indexModels.js";

export const obtenerPagosVendedores = async (req, res) => {
  try {
    const { estado } = req.query;

    const rolVendedor = await db.Rol.findOne({
      where: { nombreRol: 'vendedor' }
    });

    if (!rolVendedor) {
      return res.status(404).json({ message: "Rol vendedor no encontrado" });
    }

    const vendedores = await db.Usuario.findAll({
      include: [
        {
          model: db.Rol,
          through: {
            model: db.Usuario_Rol,
            attributes: []
          },
          where: { id_rol: rolVendedor.id_rol },
          attributes: []
        }
      ],
      attributes: ['id_usuario', 'nombre', 'correo']
    });

    const resumenPagos = [];

    for (const vendedor of vendedores) {
      const pedidosVendedor = await db.pedido_vendedor.findAll({
        where: { id_usuario: vendedor.id_usuario },
        include: [
          {
            model: db.Pedido,
            as: 'Pedido',
            attributes: ['id_pedido', 'precio_bruto', 'comision_servicio', 'total', 'estado', 'fecha_creacion'],
            where: {
              estado: {
                [Op.in]: ['entregado', 'en_reparto', 'listo_para_recoger', 'aceptado']
              }
            },
            required: false
          }
        ],
        attributes: ['id_pedido', 'estado_pago']
      });

      let pedidosFiltrados = pedidosVendedor.filter(p => p.Pedido !== null);
      
      if (estado === 'pendiente') {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.estado_pago === 'pendiente');
      } else if (estado === 'pagado') {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.estado_pago === 'pagado');
      }

      const pedidosValidos = pedidosVendedor.filter(p => p.Pedido !== null);
      const totalPedidos = pedidosValidos.length;
      const pedidosPendientes = pedidosValidos.filter(p => p.estado_pago === 'pendiente').length;
      
      // Calcular totales usando los campos correctos
      const totalPrecioBruto = pedidosValidos.reduce((sum, p) => sum + parseFloat(p.Pedido.precio_bruto || 0), 0);
      const totalComisiones = pedidosValidos.reduce((sum, p) => sum + parseFloat(p.Pedido.comision_servicio || 0), 0);
      
      // Calcular IVA de las comisiones: IVA = Comisión - (Comisión / 1.19)
      const ivaComision = totalComisiones - (totalComisiones / 1.19);
      
      // Monto a pagar = Precio Bruto - Comisiones
      const montoAPagar = totalPrecioBruto - totalComisiones;

      if (estado !== 'all' && pedidosFiltrados.length === 0 && totalPedidos === 0) continue;

      resumenPagos.push({
        id_vendedor: vendedor.id_usuario,
        nombre_vendedor: vendedor.nombre,
        email_vendedor: vendedor.correo,
        total_pedidos: totalPedidos,
        pedidos_pendientes: pedidosPendientes,
        total_precio_bruto: parseFloat(totalPrecioBruto.toFixed(2)),
        total_comisiones: parseFloat(totalComisiones.toFixed(2)),
        iva_comision: parseFloat(ivaComision.toFixed(2)),
        monto_a_pagar: parseFloat(montoAPagar.toFixed(2))
      });
    }

    resumenPagos.sort((a, b) => b.pedidos_pendientes - a.pedidos_pendientes);

    res.json(resumenPagos);
  } catch (error) {
    console.error('Error al obtener pagos de vendedores:', error);
    res.status(500).json({ 
      message: "Error al obtener información de pagos",
      error: error.message 
    });
  }
};

export const obtenerDetallePagosVendedor = async (req, res) => {
  try {
    const { id_vendedor } = req.params;

    const pedidosVendedor = await db.pedido_vendedor.findAll({
      where: { id_usuario: id_vendedor },
      include: [
        {
          model: db.Pedido,
          as: 'Pedido',
          attributes: ['id_pedido', 'precio_bruto', 'comision_servicio', 'total', 'estado', 'fecha_creacion', 'direccion'],
          where: {
            estado: {
              [Op.in]: ['entregado', 'en_reparto', 'listo_para_recoger', 'aceptado']
            }
          }
        }
      ],
      attributes: ['id_pedido', 'estado_pago'],
      order: [[{ model: db.Pedido, as: 'Pedido' }, 'fecha_creacion', 'DESC']]
    });

    const detallePedidos = pedidosVendedor.map(item => {
      const precioBruto = parseFloat(item.Pedido.precio_bruto || 0);
      const comision = parseFloat(item.Pedido.comision_servicio || 0);
      const montoVendedor = precioBruto - comision;

      return {
        id_pedido: item.id_pedido,
        fecha_pedido: item.Pedido.fecha_creacion,
        precio_bruto: precioBruto,
        comision_servicio: comision,
        monto_vendedor: montoVendedor,
        total_pedido: parseFloat(item.Pedido.total || 0),
        estado_pedido: item.Pedido.estado,
        estado_pago: item.estado_pago,
        direccion: item.Pedido.direccion
      };
    });

    res.json(detallePedidos);
  } catch (error) {
    console.error('Error al obtener detalle de pagos:', error);
    res.status(500).json({ 
      message: "Error al obtener detalle de pagos",
      error: error.message 
    });
  }
};

export const marcarPedidosComoPagados = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id_vendedor } = req.params;

    const [updatedCount] = await db.pedido_vendedor.update(
      { estado_pago: 'pagado' },
      {
        where: {
          id_usuario: id_vendedor,
          estado_pago: 'pendiente'
        },
        transaction: t
      }
    );

    await t.commit();

    res.json({
      message: `${updatedCount} pedidos marcados como pagados`,
      pedidos_actualizados: updatedCount
    });
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Error al marcar pagos:', error);
    res.status(500).json({ 
      message: "Error al procesar pagos",
      error: error.message 
    });
  }
};