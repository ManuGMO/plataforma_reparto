import db from "../models/indexModels.js";

// Helper para logs detallados
const logNotification = (receiverId, message, status, role) => {
  console.log(`[NOTIFICACIÓN] 📨 Para Usuario ID: ${receiverId} (Rol: ${role || 'N/A'}) | Mensaje: "${message}" | Estado: ${status}`);
};

// Notificar Repartidores (Pedido Pendiente - Aviso anticipado)
const notificarRepartidoresPedidoPendiente = async (pedido) => {
  try {
    const repartidores = await db.Usuario.findAll({
      include: [{
        model: db.Rol,
        where: { nombreRol: 'repartidor' }
      }]
    });

    const mensaje = `📍 Hay un pedido nuevo cerca de ti (Pedido #${pedido.id_pedido}). Puede que pronto necesite repartición.`;

    for (const repartidor of repartidores) {
      await crearNotificacionDB(repartidor.id_usuario, pedido.id_pedido, 'pedido_pendiente', '📍 Pedido Entrante Cercano', mensaje, undefined, 'repartidor');
    }
    console.log(`📡 Aviso anticipado de pedido pendiente enviado a ${repartidores.length} repartidores.`);
  } catch (error) {
    console.error("❌ Error notificando repartidores (pedido pendiente):", error);
  }
};

// Notificar al Vendedor de un nuevo pedido
export const enviarNotificacionNuevoPedido = async (pedido) => {
  try {
    const pedidoConVendedores = await db.Pedido.findByPk(pedido.id_pedido, {
      include: [{
        model: db.Usuario,
        as: 'Vendedor',
        through: { attributes: [] }
      }]
    });

    if (!pedidoConVendedores || !pedidoConVendedores.Vendedor) return;

    for (const vendedor of pedidoConVendedores.Vendedor) {
      const mensaje = `¡Tienes un nuevo pedido! Pedido #${pedido.id_pedido} por un total de $${pedido.total}`;
      await crearNotificacionDB(vendedor.id_usuario, pedido.id_pedido, 'pedido_nuevo', '🎉 Nuevo Pedido Recibido', mensaje, undefined, 'vendedor');
    }

    // Aviso anticipado a repartidores de que hay un pedido nuevo cerca
    await notificarRepartidoresPedidoPendiente(pedido);

  } catch (error) {
    console.error("❌ Error enviando notificación de nuevo pedido:", error);
  }
};

// Notificar Repartidores (Pedido Aceptado)
const notificarRepartidoresDisponibles = async (pedido) => {
  try {
    const repartidores = await db.Usuario.findAll({
      include: [{
        model: db.Rol,
        where: { nombreRol: 'repartidor' }
      }]
    });

    const mensaje = `Hay un nuevo pedido disponible para repartir cerca de ti. Pedido #${pedido.id_pedido}`;

    for (const repartidor of repartidores) {
      await crearNotificacionDB(repartidor.id_usuario, pedido.id_pedido, 'pedido_nuevo', '🛵 Nuevo Pedido Disponible', mensaje, undefined, 'repartidor');
    }
    console.log(`📡 Notificación de pedido disponible enviada a ${repartidores.length} repartidores.`);
  } catch (error) {
    console.error("❌ Error notificando repartidores:", error);
  }
};

export const enviarNotificacionCambioEstado = async (pedido, estadoAnterior, estadoNuevo) => {
  try {
    console.log(`🔔 Procesando cambio de estado pedido ${pedido.id_pedido}: ${estadoAnterior} → ${estadoNuevo}`);

    // 1. Notificar al Comprador (Siempre)
    const pedidoCompleto = await db.Pedido.findByPk(pedido.id_pedido, {
      include: [
        {
          model: db.Usuario,
          as: "Comprador",
          through: { attributes: [] },
          attributes: ['id_usuario', 'nombre', 'correo']
        },
        {
          model: db.Usuario,
          as: "Repartidor",
          through: { attributes: [] }
        }
      ]
    });

    if (pedidoCompleto?.Comprador?.length) {
      const comprador = pedidoCompleto.Comprador[0];
      await crearNotificacionDB(comprador.id_usuario, pedido.id_pedido, 'cambio_estado', undefined, undefined, estadoNuevo, 'comprador');
    }

    // 2. Lógica específica por estado
    if (estadoNuevo === 'aceptado') {
      // Notificar Repartidores Cercanos
      await notificarRepartidoresDisponibles(pedido);
    }

    if (estadoNuevo === 'listo_para_recoger') {
      // Notificar al Repartidor Asignado (si existe)
      if (pedidoCompleto?.Repartidor?.length) {
        const repartidor = pedidoCompleto.Repartidor[0];
        const mensaje = `El pedido #${pedido.id_pedido} está listo para ser recogido en el local.`;
        await crearNotificacionDB(repartidor.id_usuario, pedido.id_pedido, 'cambio_estado', '📦 Pedido Listo', mensaje, undefined, 'repartidor');
      }
    }

  } catch (error) {
    console.error("❌ Error al enviar notificación:", error);
  }
};

const crearNotificacionDB = async (id_usuario, id_pedido, tipo, tituloPersonalizado, mensajePersonalizado, estadoParaMensaje, rolDestino) => {

  let titulo = tituloPersonalizado;
  let mensaje = mensajePersonalizado;

  // Si no se pasan personalizados, usar defaults basados en estado
  if (estadoParaMensaje) {
    const mensajesDefaults = {
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

    if (!titulo) titulo = `${iconos[estadoParaMensaje] || '📋'} Actualización de tu pedido #${id_pedido}`;
    if (!mensaje) mensaje = mensajesDefaults[estadoParaMensaje] || `Tu pedido ahora está en estado: ${estadoParaMensaje}`;
  }

  const notificacion = await db.Notificacion.create({
    id_usuario: id_usuario,
    id_pedido: id_pedido,
    tipo: tipo,
    rol_destino: rolDestino || null, // Guardar el rol destino
    titulo: titulo,
    mensaje: mensaje,
    estado: 'no_leida',
    fecha_creacion: new Date()
  });

  logNotification(id_usuario, mensaje, 'no_leida', rolDestino);
  return notificacion;
};