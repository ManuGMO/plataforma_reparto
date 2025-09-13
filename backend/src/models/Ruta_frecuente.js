import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Ruta_frecuente = sequelize.define('Ruta_frecuente', {
    id_ruta: {
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
    origen: {
      type: DataTypes.STRING(200)
    },
    destino: {
      type: DataTypes.STRING(200)
    },
    horario: {
      type: DataTypes.TIME
    },
    dia: {
      type: DataTypes.ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
    }
  }, {
    tableName: 'Ruta_frecuente',
    timestamps: false
  });

  Ruta_frecuente.associate = (models) => {
    Ruta_frecuente.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
  };

  return Ruta_frecuente;
};