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
              model: db.Producto.scope('conEliminados'), // 🔥 AQUÍ EL CAMBIO
              through: {
                model: db.Producto_Pedido,
                attributes: ['cantidad', 'precio_unitario']
              },
              attributes: ["id_producto", "nombre", "activo"] // Incluir activo
            }
          ]
        }
      ]
    });

    // También agrega una validación de seguridad
    const pedidosTransformados = pedidos.map((pedidoVendedor) => {
      const pedido = pedidoVendedor.Pedido;
      
      // 🔥 Validación de seguridad
      if (!pedido) {
        console.warn('Pedido no encontrado para pedidoVendedor:', pedidoVendedor.id);
        return null; // o maneja como prefieras
      }
     
      return {
        id_pedido: pedido.id_pedido,
        cliente: pedido.Comprador?.[0]?.nombre || "Cliente no disponible",
        estado: pedido.estado,
        fecha_creacion: pedido.fecha_creacion,
        total: pedido.total,
        estado_pago: pedidoVendedor.estado_pago,
        items: pedido.Productos.map((producto) => ({
          nombre: producto.nombre,
          cantidad: producto.Producto_Pedido.cantidad,
          precio_unitario: producto.Producto_Pedido.precio_unitario,
          producto_eliminado: !producto.activo // Info adicional útil
        })),
      };
    }).filter(pedido => pedido !== null); // Filtrar nulls si los hay

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

    // Verificar que el vendedor que intenta actualizar es el dueño del pedido
    const vendedorAsignado = pedido.Vendedor.find(v => v.id_usuario == id_vendedor);
    if (!vendedorAsignado && id_vendedor) {
      await transaction.rollback();
      return res.status(403).json({
        error: 'No tienes permisos para actualizar este pedido'
      });
    }

    // Definir transiciones válidas para el vendedor
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

    // Validar transición
    if (!transicionesValidasVendedor[pedido.estado]?.includes(estado)) {
      await transaction.rollback();
      return res.status(400).json({
        error: `No se puede cambiar de estado ${pedido.estado} a ${estado}`,
        transiciones_permitidas: transicionesValidasVendedor[pedido.estado] || []
      });
    }

    // Actualizar estado
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

