import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Pedido = sequelize.define('Pedido', {
    id_pedido: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    direccion: {
      type: DataTypes.STRING(200)
    },
    total: {
      type: DataTypes.INTEGER
    },
    estado: {
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
    },
    tiene_repartidor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    fecha_entrega: {
      type: DataTypes.DATE
    },
    hora_entrega: {
      type: DataTypes.TIME
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    }
  }, {
    tableName: 'Pedido',
    timestamps: false,
    hooks: {
  afterUpdate: async (pedido, options) => {
    if (pedido.changed('estado')) {
      const estadoAnterior = pedido._previousDataValues.estado;
      const estadoNuevo = pedido.estado;

      if (options.transaction) {
        options.transaction.afterCommit(async () => {
          const { enviarNotificacionCambioEstado } = await import('../services/notificationService.js');
          try {
            await enviarNotificacionCambioEstado(pedido, estadoAnterior, estadoNuevo);
          } catch (err) {
            console.error("❌ Error enviando notificación:", err);
          }
        });
      } else {
        // Si no hay transacción, ejecutar directo
        const { enviarNotificacionCambioEstado } = await import('../services/notificationService.js');
        await enviarNotificacionCambioEstado(pedido, estadoAnterior, estadoNuevo);
      }
    }
  }
}
  });

  Pedido.associate = (models) => {
    // Relaciones con productos
    Pedido.belongsToMany(models.Producto, {
      through: models.Producto_Pedido,
      foreignKey: 'id_pedido'
    });
   
    // Relaciones con usuarios por roles
    Pedido.belongsToMany(models.Usuario, {
      through: models.pedido_comprador,
      foreignKey: 'id_pedido',
      as: 'Comprador'
    });
    Pedido.belongsToMany(models.Usuario, {
      through: models.pedido_vendedor,
      foreignKey: 'id_pedido',
      as: 'Vendedor'
    });
    Pedido.belongsToMany(models.Usuario, {
      through: models.pedido_repartidor,
      foreignKey: 'id_pedido',
      as: 'Repartidor'
    });
   
    // Calificación
    Pedido.hasMany(models.Calificacion, { foreignKey: 'id_pedido' });
   
    // Notificaciones
    Pedido.hasMany(models.Notificacion, { foreignKey: 'id_pedido' });
  };

  return Pedido;
};