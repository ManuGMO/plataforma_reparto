import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const pedido_repartidor = sequelize.define('pedido_repartidor', {
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
    tableName: 'pedido_repartidor',
    timestamps: false
  });

  pedido_repartidor.associate = (models) => {
    pedido_repartidor.belongsTo(models.Pedido, {
      foreignKey: 'id_pedido',
      as: 'Pedido'
    });

    pedido_repartidor.belongsTo(models.Usuario, {
      foreignKey: 'id_usuario',
      as: 'Repartidor'
    });
  };


  return pedido_repartidor;
};