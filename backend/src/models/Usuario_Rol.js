import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Usuario_Rol = sequelize.define('Usuario_Rol', {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Rol',
        key: 'id_rol'
      }
    }
  }, {
    tableName: 'Usuario_Rol',
    timestamps: false
  });

  return Usuario_Rol;
};
