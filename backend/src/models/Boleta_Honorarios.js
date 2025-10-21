import { DataTypes } from 'sequelize';

// Nota: este archivo define el model que en DB usa la tabla 'Liquidacion'.
// Para intercambiar los nombres a nivel de código (según petición), exponemos
// este modelo con el nombre `Boleta_Honorarios` (manteniendo tableName 'Liquidacion').
export default (sequelize) => {
  const Boleta_Honorarios = sequelize.define('Boleta_Honorarios', {
    id_boleta: {
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
      type: DataTypes.INTEGER
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'cancelado'),
      defaultValue: 'pendiente'
    }
  }, {
    tableName: 'Boleta_Honorarios',
    timestamps: false
  });

  Boleta_Honorarios.associate = (models) => {
    Boleta_Honorarios.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
  };

  return Boleta_Honorarios;
};