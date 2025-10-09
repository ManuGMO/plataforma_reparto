import db from '../models/indexModels.js';

export const obtenerUsuariosPorRol = async (nombreRol) => {
  const rol = await db.Rol.findOne({
    where: { nombreRol }
  });

  if (!rol) {
    throw new Error(`Rol ${nombreRol} no encontrado`);
  }

  return await db.Usuario.findAll({
    include: [
      {
        model: db.Rol,
        through: {
          model: db.Usuario_Rol,
          attributes: []
        },
        where: { id_rol: rol.id_rol },
        attributes: []
      }
    ],
    attributes: ['id_usuario', 'nombre', 'correo', 'estado']
  });
};