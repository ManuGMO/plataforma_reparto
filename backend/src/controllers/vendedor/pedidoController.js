import db from "../../models/indexModels.js";


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
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const pedido = await db.Pedido.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    pedido.estado = estado;
    await pedido.save();

    res.json({ message: "Estado actualizado correctamente", pedido });
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    res.status(500).json({ message: "Error al actualizar el estado del pedido" });
  }
};


