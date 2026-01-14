import db from "../models/indexModels.js";

// Obtener notificaciones de un usuario
export const obtenerNotificacionesUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { rol } = req.query; // Rol activo del usuario (opcional)

    const whereClause = { id_usuario };

    // Si se especifica un rol, filtrar notificaciones para ese rol O generales (null)
    if (rol) {
      whereClause.rol_destino = {
        [db.Sequelize.Op.or]: [rol, null]
      };
    }

    const notificaciones = await db.Notificacion.findAll({
      where: whereClause,
      include: [
        {
          model: db.Pedido,
          attributes: ['id_pedido', 'estado', 'total'],
          required: false
        }
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: 50 // Limitar a las últimas 50 notificaciones
    });

    res.json(notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

// Obtener solo notificaciones no leídas
export const obtenerNotificacionesNoLeidas = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { rol } = req.query; // Rol activo del usuario

    const whereClause = {
      id_usuario,
      estado: 'no_leida'
    };

    // Filtro por rol si se proporciona
    if (rol) {
      whereClause.rol_destino = {
        [db.Sequelize.Op.or]: [rol, null]
      };
    }

    const notificaciones = await db.Notificacion.findAll({
      where: whereClause,
      include: [
        {
          model: db.Pedido,
          attributes: ['id_pedido', 'estado', 'total'],
          required: false
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    res.json(notificaciones);
  } catch (error) {
    console.error("Error al obtener notificaciones no leídas:", error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

// Marcar notificación como leída
export const marcarComoLeida = async (req, res) => {
  try {
    const { id_notificacion } = req.params;

    const notificacion = await db.Notificacion.findByPk(id_notificacion);
    if (!notificacion) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    await notificacion.update({ estado: 'leida' });
    console.log(`[NOTIFICACIÓN] 👀 Notificación ID: ${id_notificacion} leída por Usuario ID: ${notificacion.id_usuario}`);
    res.json(notificacion);
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    res.status(500).json({ message: "Error al actualizar notificación" });
  }
};

// Marcar todas las notificaciones de un usuario como leídas
export const marcarTodasComoLeidas = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    await db.Notificacion.update(
      { estado: 'leida' },
      {
        where: {
          id_usuario,
          estado: 'no_leida'
        }
      }
    );

    res.json({ message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error);
    res.status(500).json({ message: "Error al actualizar notificaciones" });
  }
};