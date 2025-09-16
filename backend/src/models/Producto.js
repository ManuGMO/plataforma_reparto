// models/Producto.js
import { DataTypes } from 'sequelize';
export default (sequelize) => {
  const Producto = sequelize.define('Producto', {
    id_producto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_categoria: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categoria',
        key: 'id_categoria'
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    precio: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    imagen: {
      type: DataTypes.STRING(255)
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'Producto',
    timestamps: false,
    // Scope por defecto para solo mostrar productos activos
    defaultScope: {
      where: {
        activo: true
      }
    },
    scopes: {
      // Scope para incluir productos eliminados
      conEliminados: {
        where: {}
      },
      // Scope solo para productos eliminados
      soloEliminados: {
        where: {
          activo: false
        }
      }
    }
  });
  Producto.associate = (models) => {
    Producto.belongsTo(models.Usuario, {
      foreignKey: 'id_usuario',
      as: 'Vendedor',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Producto.belongsTo(models.Categoria, {
      foreignKey: 'id_categoria',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
   
    // Relaciones muchos a muchos con cascade
    Producto.belongsToMany(models.Carrito, {
      through: models.Carrito_Producto,
      foreignKey: 'id_producto',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    Producto.belongsToMany(models.Pedido, {
      through: models.Producto_Pedido,
      foreignKey: 'id_producto',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };
  return Producto;
};