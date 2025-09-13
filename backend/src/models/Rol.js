import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Rol = sequelize.define('Rol', {
    id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombreRol: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    tableName: 'Rol',
    timestamps: false
  });

  Rol.associate = (models) => {
    Rol.belongsToMany(models.Usuario, {
      through: models.Usuario_Rol,
      foreignKey: 'id_rol',
      otherKey: 'id_usuario'
    });
  };

  return Rol;
};
