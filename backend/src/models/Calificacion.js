import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Calificacion = sequelize.define('Calificacion', {
    id_calificacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Pedido',
        key: 'id_pedido'
      }
    },
    valor: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    },
    comentario: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'Calificacion',
    timestamps: false
  });

  Calificacion.associate = (models) => {
    Calificacion.belongsTo(models.Pedido, { foreignKey: 'id_pedido' });
  };

  return Calificacion;
};