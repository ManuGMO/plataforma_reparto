import db from "../../models/indexModels.js";
import { Op } from "sequelize";


export const obtenerTodosLosUsuarios = async (req, res) => {
  try {
    // Obtener todos los usuarios con sus roles
    const usuarios = await db.Usuario.findAll({
      include: [
        {
          model: db.Rol,
          through: {
            model: db.Usuario_Rol,
            attributes: []
          },
          attributes: ['id_rol', 'nombreRol']
        }
      ],
      attributes: ['id_usuario', 'nombre', 'correo', 'estado', 'fecha_registro'],
      order: [['fecha_registro', 'DESC']]
    });

    // Formatear respuesta
    const usuariosFormateados = usuarios.map(usuario => ({
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      estado: usuario.estado,
      fecha_registro: usuario.fecha_registro,
      roles: usuario.Rols ? usuario.Rols.map(rol => rol.nombreRol) : []
    }));

    res.json(usuariosFormateados);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      message: "Error al obtener usuarios",
      error: error.message
    });
  }
};

export const bloquearUsuario = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id_usuario } = req.params;
    const { motivo } = req.body;

    // Verificar que el usuario existe
    const usuario = await db.Usuario.findByPk(id_usuario, { transaction: t });

    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (usuario.estado === 'bloqueado') {
      await t.rollback();
      return res.status(400).json({ message: "El usuario ya está bloqueado" });
    }

    // Actualizar estado del usuario
    await usuario.update({
      estado: 'bloqueado'
    }, { transaction: t });

    // Registrar el bloqueo en la tabla Bloqueo (opcional)
    if (db.Bloqueo) {
      await db.Bloqueo.create({
        id_bloqueado: id_usuario,
        id_bloqueador: null, // ID del admin si lo tienes
        motivo: motivo,
        fecha: new Date()
      }, { transaction: t });
    }

    await t.commit();

    res.json({
      message: "Usuario bloqueado correctamente",
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        estado: usuario.estado
      }
    });
  } catch (error) {
    // Solo hacer rollback si la transacción no está finalizada
    if (!t.finished) {
      await t.rollback();
    }
    console.error('Error al bloquear usuario:', error);
    res.status(500).json({
      message: "Error al bloquear usuario",
      error: error.message
    });
  }
};

export const desbloquearUsuario = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id_usuario } = req.params;

    const usuario = await db.Usuario.findByPk(id_usuario, { transaction: t });

    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (usuario.estado === 'activo') {
      await t.rollback();
      return res.status(400).json({ message: "El usuario ya está activo" });
    }

    // Actualizar estado del usuario
    await usuario.update({
      estado: 'activo'
    }, { transaction: t });

    await t.commit();

    res.json({
      message: "Usuario desbloqueado correctamente",
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        estado: usuario.estado
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al desbloquear usuario:', error);
    res.status(500).json({
      message: "Error al desbloquear usuario",
      error: error.message
    });
  }
};

export const obtenerValoracionesUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const valoraciones = await db.Valoracion.findAll({
      where: {
        id_usuario_evaluado: id_usuario
      },
      include: [
        {
          model: db.Usuario,
          as: 'Comprador',
          attributes: ['nombre', 'correo']
        }
      ],
      order: [['fecha', 'DESC']]
    });

    const totalValoraciones = valoraciones.length;
    const sumaCalificaciones = valoraciones.reduce((sum, v) => sum + v.calificacion, 0);
    const promedioCalificacion = totalValoraciones > 0 ? (sumaCalificaciones / totalValoraciones).toFixed(1) : 0;

    const distribucionCalificaciones = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    valoraciones.forEach(v => {
      if (distribucionCalificaciones[v.calificacion] !== undefined) {
        distribucionCalificaciones[v.calificacion]++;
      }
    });

    const valoracionesFormateadas = valoraciones.map(v => ({
      id_valoracion: v.id_valoracion,
      calificacion: v.calificacion,
      comentario: v.comentario,
      fecha: v.fecha,
      nombreEvaluador: v.Comprador ? v.Comprador.nombre : 'Usuario desconocido'
    }));

    res.json({
      valoraciones: valoracionesFormateadas,
      estadisticas: {
        totalValoraciones,
        promedioCalificacion: parseFloat(promedioCalificacion),
        distribucionCalificaciones
      }
    });

  } catch (error) {
    console.error('Error al obtener valoraciones:', error);
    res.status(500).json({
      message: "Error al obtener valoraciones",
      error: error.message
    });
  }
};