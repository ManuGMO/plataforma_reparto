import db from "../models/indexModels.js";

export const enviarNotificacionCambioEstado = async (pedido, estadoAnterior, estadoNuevo) => {
  try {
    console.log(`🔔 Enviando notificación para pedido ${pedido.id_pedido}: ${estadoAnterior} → ${estadoNuevo}`);
    
    // Obtener información del comprador
    const pedidoCompleto = await db.Pedido.findByPk(pedido.id_pedido, {
      include: [
        { 
          model: db.Usuario, 
          as: "Comprador", 
          through: { attributes: [] },
          attributes: ['id_usuario', 'nombre', 'correo']
        }
      ]
    });

    if (!pedidoCompleto?.Comprador?.length) {
      console.error("❌ No se encontró comprador para el pedido", pedido.id_pedido);
      return;
    }

    const comprador = pedidoCompleto.Comprador[0];
    
    // Crear notificación en base de datos
    await crearNotificacionDB(comprador.id_usuario, pedido.id_pedido, estadoNuevo);
    
    console.log(`✅ Notificación creada para usuario ${comprador.id_usuario}`);
    
  } catch (error) {
    console.error("❌ Error al enviar notificación:", error);
  }
};

const crearNotificacionDB = async (id_usuario, id_pedido, estado) => {
  const mensajes = {
    'pendiente': 'Tu pedido ha sido recibido y está siendo procesado',
    'aceptado': 'Tu pedido ha sido aceptado y está en preparación',
    'listo_para_recoger': 'Tu pedido está listo para recoger',
    'en_reparto': 'Tu pedido está en camino',
    'entregado': 'Tu pedido ha sido entregado exitosamente',
    'rechazado': 'Lo sentimos, tu pedido ha sido rechazado',
    'cancelado': 'Tu pedido ha sido cancelado'
  };

  const iconos = {
    'pendiente': '⏳',
    'aceptado': '👨‍🍳',
    'listo_para_recoger': '📦',
    'en_reparto': '🚚',
    'entregado': '✅',
    'rechazado': '❌',
    'cancelado': '🚫'
  };

  await db.Notificacion.create({
    id_usuario: id_usuario,
    id_pedido: id_pedido,
    tipo: 'cambio_estado',
    titulo: `${iconos[estado] || '📋'} Actualización de tu pedido #${id_pedido}`,
    mensaje: mensajes[estado] || `Tu pedido ahora está en estado: ${estado}`,
    estado: 'no_leida',
    fecha_creacion: new Date()
  });
};