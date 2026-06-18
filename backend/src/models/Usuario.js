import { DataTypes } from 'sequelize';
export default (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    contraseña: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    correo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('activo', 'bloqueado'),
      defaultValue: 'activo'
    },
    fecha_registro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    longitud: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    }
  }, {
    tableName: 'Usuario',
    timestamps: false
  });

  Usuario.associate = (models) => {
    // Relaciones con roles (muchos a muchos)
    Usuario.belongsToMany(models.Rol, {
      through: models.Usuario_Rol,
      foreignKey: 'id_usuario',
      otherKey: 'id_rol'
    });

    // Relaciones uno a muchos
    Usuario.hasMany(models.Carrito, { foreignKey: 'id_usuario' });
    Usuario.hasMany(models.Producto, { foreignKey: 'id_usuario', as: 'ProductosVendidos' });
    Usuario.hasMany(models.Ruta_frecuente, { foreignKey: 'id_usuario' });
    Usuario.hasMany(models.Liquidacion, { foreignKey: 'id_usuario' });

    // Relaciones con pedidos
    Usuario.belongsToMany(models.Pedido, {
      through: models.pedido_comprador,
      foreignKey: 'id_usuario',
      as: 'PedidosComprador'
    });
    Usuario.belongsToMany(models.Pedido, {
      through: models.pedido_vendedor,
      foreignKey: 'id_usuario',
      as: 'PedidosVendedor'
    });
    Usuario.belongsToMany(models.Pedido, {
      through: models.pedido_repartidor,
      foreignKey: 'id_usuario',
      as: 'PedidosRepartidor'
    });

    // Relaciones con tiendas
    Usuario.belongsToMany(models.Tienda, {
      through: models.atiende,
      foreignKey: 'id_usuario'
    });

    // Valoraciones
    Usuario.hasMany(models.Valoracion, { foreignKey: 'id_comprador', as: 'ValoracionesDadas' });
    Usuario.hasMany(models.Valoracion, { foreignKey: 'id_usuario_evaluado', as: 'ValoracionesRecibidas' });

    // Bloqueos
    Usuario.hasMany(models.Bloqueo, { foreignKey: 'id_bloqueado', as: 'BloqueoRecibido' });
    Usuario.hasMany(models.Bloqueo, { foreignKey: 'id_bloqueador', as: 'BloqueoDado' });
  };

  return Usuario;
};