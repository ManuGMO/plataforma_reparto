import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const pedido_vendedor = sequelize.define('pedido_vendedor', {
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
    },
    estado_pago: {
      type: DataTypes.ENUM('pendiente', 'pagado'),
      defaultValue: 'pendiente',
      allowNull: false
    },
    estado_pedido: {
      type: DataTypes.ENUM(
        'pendiente',
        'aceptado',
        'listo_para_recoger',
        'en_reparto',
        'entregado',
        'rechazado',
        'cancelado'
      ),
      defaultValue: 'pendiente'
    }
  }, {
    tableName: 'pedido_vendedor',
    timestamps: false
  });

  pedido_vendedor.associate = (models) => {
    // Relación con Pedido
    pedido_vendedor.belongsTo(models.Pedido, {
      foreignKey: 'id_pedido',
      as: 'Pedido' // Importante: usar el mismo alias que en el include
    });

    // Relación con Usuario (Vendedor)
    pedido_vendedor.belongsTo(models.Usuario, {
      foreignKey: 'id_usuario',
      as: 'Usuario'
    });
  };

  return pedido_vendedor;
};