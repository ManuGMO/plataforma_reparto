import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Bloqueo = sequelize.define('Bloqueo', {
    id_bloqueo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_bloqueado: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_bloqueador: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    motivo: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'Bloqueo',
    timestamps: false
  });

  Bloqueo.associate = (models) => {
    Bloqueo.belongsTo(models.Usuario, { foreignKey: 'id_bloqueado', as: 'UsuarioBloqueado' });
    Bloqueo.belongsTo(models.Usuario, { foreignKey: 'id_bloqueador', as: 'UsuarioBloqueador' });
  };

  return Bloqueo;
};
