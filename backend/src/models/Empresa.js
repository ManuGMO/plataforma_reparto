import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Empresa = sequelize.define('Empresa', {
    id_empresa: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombreEmpresa: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    rut: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20)
    }
  }, {
    tableName: 'Empresa',
    timestamps: false
  });

  Empresa.associate = (models) => {
    Empresa.hasMany(models.Tienda, { foreignKey: 'id_empresa' });
  };

  return Empresa;
};