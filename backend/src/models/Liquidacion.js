import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Liquidacion = sequelize.define('Liquidacion', {
    id_liquidacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    tipo: {
      type: DataTypes.STRING(50)
    },
    periodo: {
      type: DataTypes.STRING(50)
    },
    total: {
      type: DataTypes.DECIMAL(10, 2)
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'cancelado'),
      defaultValue: 'pendiente'
    }
  }, {
    tableName: 'Liquidacion',
    timestamps: false
  });

  Liquidacion.associate = (models) => {
    Liquidacion.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
    Liquidacion.hasMany(models.Boleta_Honorarios, { foreignKey: 'id_liquidacion' });
  };

  return Liquidacion;
};