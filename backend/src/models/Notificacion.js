import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Notificacion = sequelize.define('Notificacion', {
    id_notificacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Pedido',
        key: 'id_pedido'
      }
    },
    tipo: {
      type: DataTypes.ENUM('cambio_estado', 'pedido_nuevo', 'promocion'),
      allowNull: false
    },
    rol_destino: {
      type: DataTypes.ENUM('comprador', 'vendedor', 'repartidor', 'admin'),
      allowNull: true,
      comment: 'Rol al que va dirigida la notificación (para usuarios multi-rol)'
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('leida', 'no_leida'),
      defaultValue: 'no_leida'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Notificacion',
    timestamps: false
  });

  Notificacion.associate = (models) => {
    Notificacion.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
    Notificacion.belongsTo(models.Pedido, { foreignKey: 'id_pedido' });
  };

  return Notificacion;
};