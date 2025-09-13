import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Carrito_Producto = sequelize.define('Carrito_Producto', {
    id_carrito: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Carrito',
        key: 'id_carrito'
      }
    },
    id_producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Producto',
        key: 'id_producto'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    tableName: 'Carrito_Producto',
    timestamps: false
  });

  return Carrito_Producto;
};