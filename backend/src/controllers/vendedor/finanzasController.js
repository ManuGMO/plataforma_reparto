import db from "../../models/indexModels.js";
import { Op, fn, col, literal } from "sequelize";
const { Usuario, Pedido, pedido_vendedor } = db;

//Obtener historial financiero del vendedor
export const getFinanzasVendedor = async (req, res) => {
  try {
    const { id } = req.params; // ID del vendedor
    console.log("Obteniendo finanzas para vendedor ID:", id);

    // Buscar todos los pedidos del vendedor con información financiera
    const pedidosFinancieros = await pedido_vendedor.findAll({
      where: { id_usuario: id },
      include: [
        {
          model: Pedido,
          as: 'Pedido', 
          attributes: [
            'id_pedido',
            'total',
            'estado',
            'fecha_creacion',
            'fecha_entrega',
            'direccion'
          ],
          required: true
        }
      ],
      attributes: [
        'id_pedido',
        'estado_pago'
      ],
      order: [
        ['id_pedido', 'DESC'] // Más recientes primero
      ]
    });

    // Formatear respuesta
    const historialFinanciero = pedidosFinancieros.map(item => ({
      id_pedido: item.id_pedido,
      fecha_pedido: item.Pedido.fecha_creacion,
      fecha_entrega: item.Pedido.fecha_entrega,
      monto: parseFloat(item.Pedido.total) || 0,
      estado_pedido: item.Pedido.estado,
      estado_pago: item.estado_pago,
      direccion: item.Pedido.direccion
    }));

    // Calcular estadísticas
    const totalPedidos = historialFinanciero.length;
    const pedidosPagados = historialFinanciero.filter(p => p.estado_pago === 'pagado').length;
    const pedidosPendientes = totalPedidos - pedidosPagados;
    const montoTotalPagado = historialFinanciero
      .filter(p => p.estado_pago === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0);
    const montoPendiente = historialFinanciero
      .filter(p => p.estado_pago === 'pendiente')
      .reduce((sum, p) => sum + p.monto, 0);

    res.json({
      historial: historialFinanciero,
      estadisticas: {
        totalPedidos,
        pedidosPagados,
        pedidosPendientes,
        montoTotalPagado: parseFloat(montoTotalPagado.toFixed(2)),
        montoPendiente: parseFloat(montoPendiente.toFixed(2)),
        montoTotal: parseFloat((montoTotalPagado + montoPendiente).toFixed(2))
      }
    });

  } catch (error) {
    console.error("Error al obtener finanzas:", error);
    res.status(500).json({ 
      error: "Error al obtener información financiera",
      details: error.message 
    });
  }
};