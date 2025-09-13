import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const pedido_comprador = sequelize.define('pedido_comprador', {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Pedido',
        key: 'id_pedido'
      }
    }
  }, {
    tableName: 'pedido_comprador',
    timestamps: false
  });

  return pedido_comprador;
};