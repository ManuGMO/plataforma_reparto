import { DataTypes } from 'sequelize';

// Este archivo define el modelo asociado a la tabla 'Boleta_Honorarios'.
// Para respetar el intercambio de nombres solicitado, expone el modelo con el
// nombre `Liquidacion` (en el código se referenciará como models.Liquidacion).
export default (sequelize) => {
  const Liquidacion = sequelize.define('Liquidacion', {
    id_liquidacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    monto_bruto: {
      type: DataTypes.INTEGER
    },
    comision: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    periodo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    impuestos: {
      type: DataTypes.INTEGER
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'cancelado'),
      defaultValue: 'pendiente'
    },
    monto_neto: {
      type: DataTypes.INTEGER
    },
    fecha_emision: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Liquidacion',
    timestamps: false
  });

  Liquidacion.associate = (models) => {
    // Este modelo representa boletas de honorarios en la tabla 'Boleta_Honorarios'
    // y ahora tiene una relación con Usuario mediante id_usuario.
    Liquidacion.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
    // No asociamos con el modelo `Boleta_Honorarios` (antigua Liquidacion) según lo solicitado.
  };

  return Liquidacion;
};