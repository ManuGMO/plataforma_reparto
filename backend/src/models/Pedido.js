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
    precio_bruto: {
      type: DataTypes.INTEGER
    },
    comision_servicio: {
      type: DataTypes.INTEGER
    },
    // Comisión que se deduce al vendedor (visible en panel admin)
    comision_vendedor: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    pago_reparto: {
      type: DataTypes.INTEGER
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
    },

    comprobante_pago: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    pago_confirmado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    fecha_confirmacion_pago: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_ultimo_cambio_estado: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado_anterior: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'Pedido',
    timestamps: false,
    hooks: {
      beforeUpdate: async (pedido, options) => {
        if (pedido.changed('estado')) {
          // Guardar el estado anterior y su fecha
          pedido.estado_anterior = pedido._previousDataValues.estado;
          pedido.fecha_estado_anterior = pedido._previousDataValues.fecha_ultimo_cambio_estado || pedido._previousDataValues.fecha_creacion;
          pedido.fecha_ultimo_cambio_estado = new Date();
        }
      },
      afterUpdate: async (pedido, options) => {
        if (pedido.changed('estado')) {
          const estadoAnterior = pedido.estado_anterior;
          const estadoNuevo = pedido.estado;

          if (options.transaction) {
            options.transaction.afterCommit(async () => {
              const { enviarNotificacionCambioEstado } = await import('../services/notificationService.js');
              try {
                await enviarNotificacionCambioEstado(pedido, estadoAnterior, estadoNuevo);
              } catch (err) {
                console.error("Error enviando notificación:", err);
              }
            });
          } else {
            const { enviarNotificacionCambioEstado } = await import('../services/notificationService.js');
            await enviarNotificacionCambioEstado(pedido, estadoAnterior, estadoNuevo);
          }
        }
      },
      afterCreate: async (pedido, options) => {
        console.log("🪝 [HOOK] afterCreate disparado para pedido:", pedido.id_pedido);
        if (options.transaction) {
          options.transaction.afterCommit(async () => {
            console.log("🪝 [HOOK] Transaction afterCommit ejecutándose para pedido:", pedido.id_pedido);
            const { enviarNotificacionNuevoPedido } = await import('../services/notificationService.js');
            try {
              await enviarNotificacionNuevoPedido(pedido);
              console.log("🪝 [HOOK] enviarNotificacionNuevoPedido ejecutado");
            } catch (err) {
              console.error("Error enviando notificación nuevo pedido:", err);
            }
          });
        } else {
          console.log("🪝 [HOOK] Ejecutando sin transacción para pedido:", pedido.id_pedido);
          const { enviarNotificacionNuevoPedido } = await import('../services/notificationService.js');
          await enviarNotificacionNuevoPedido(pedido);
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