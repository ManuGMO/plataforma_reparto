import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Producto_Pedido = sequelize.define('Producto_Pedido', {
    id_pedido: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Pedido',
        key: 'id_pedido'
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
      allowNull: false
    },
    precio_unitario: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Producto_Pedido',
    timestamps: false
  });

  return Producto_Pedido;
};