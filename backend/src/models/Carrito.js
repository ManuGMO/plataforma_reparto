import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Carrito = sequelize.define('Carrito', {
    id_carrito: {
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
    }
  }, {
    tableName: 'Carrito',
    timestamps: false
  });

  Carrito.associate = (models) => {
    Carrito.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
    Carrito.belongsToMany(models.Producto, {
      through: models.Carrito_Producto,
      foreignKey: 'id_carrito'
    });
  };

  return Carrito;
};