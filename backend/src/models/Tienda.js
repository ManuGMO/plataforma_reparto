import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Tienda = sequelize.define('Tienda', {
    id_tienda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_empresa: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Empresa',
        key: 'id_empresa'
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    direccion: {
      type: DataTypes.STRING(200)
    },
    telefono: {
      type: DataTypes.STRING(20)
    }
  }, {
    tableName: 'Tienda',
    timestamps: false
  });

  Tienda.associate = (models) => {
    Tienda.belongsTo(models.Empresa, { foreignKey: 'id_empresa' });
    Tienda.belongsToMany(models.Usuario, {
      through: models.atiende,
      foreignKey: 'id_tienda'
    });
  };

  return Tienda;
};