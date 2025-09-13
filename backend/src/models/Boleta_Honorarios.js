import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Boleta_Honorarios = sequelize.define('Boleta_Honorarios', {
    id_boleta: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_liquidacion: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Liquidacion',
        key: 'id_liquidacion'
      }
    },
    monto_bruto: {
      type: DataTypes.DECIMAL(10, 2)
    },
    impuestos: {
      type: DataTypes.DECIMAL(10, 2)
    },
    monto_neto: {
      type: DataTypes.DECIMAL(10, 2)
    },
    fecha_emision: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Boleta_Honorarios',
    timestamps: false
  });

  Boleta_Honorarios.associate = (models) => {
    Boleta_Honorarios.belongsTo(models.Liquidacion, { foreignKey: 'id_liquidacion' });
  };

  return Boleta_Honorarios;
};