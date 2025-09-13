import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Categoria = sequelize.define('Categoria', {
    id_categoria: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'Categoria',
    timestamps: false
  });

  Categoria.associate = (models) => {
    Categoria.hasMany(models.Producto, { foreignKey: 'id_categoria' });
  };

  return Categoria;
};
