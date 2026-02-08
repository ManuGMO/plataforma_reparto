import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Valoracion = sequelize.define('Valoracion', {
    id_valoracion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_comprador: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_usuario_evaluado: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_pedido: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Pedido',
        key: 'id_pedido'
      }
    },
    tipo: {
      type: DataTypes.ENUM('comprador_a_repartidor', 'comprador_a_vendedor'),
      allowNull: false
    },
    calificacion: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    },
    comentario: {
      type: DataTypes.TEXT
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Valoracion',
    timestamps: false
  });

  Valoracion.associate = (models) => {
    Valoracion.belongsTo(models.Usuario, { foreignKey: 'id_comprador', as: 'Comprador' });
    Valoracion.belongsTo(models.Usuario, { foreignKey: 'id_usuario_evaluado', as: 'UsuarioEvaluado' });

  };

  return Valoracion;
};