// models/Ruta_frecuente.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Ruta_frecuente = sequelize.define('Ruta_frecuente', {
    id_ruta: {
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
    nombre_ruta: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nombre descriptivo de la ruta (ej: Casa-Trabajo)'
    },
    // Información del origen
    origen: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    origen_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: 'Latitud del punto de origen'
    },
    origen_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: 'Longitud del punto de origen'
    },
    // Información del destino
    destino: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    destino_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: 'Latitud del punto de destino'
    },
    destino_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: 'Longitud del punto de destino'
    },
    // Horarios (rango de disponibilidad)
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: 'Hora de inicio de disponibilidad'
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: 'Hora de fin de disponibilidad'
    },
    // Día de la semana
    dia: {
      type: DataTypes.ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
      allowNull: false
    },
    // Campo opcional para guardar la geometría de la ruta completa
    ruta_geojson: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'GeoJSON de la ruta completa calculada por Mapbox'
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Indica si la ruta está activa o deshabilitada'
    }
  }, {
    tableName: 'Ruta_frecuente',
    timestamps: false, // Desactivar timestamps
    // Si decides usar timestamps más adelante, descomenta estas líneas:
    // timestamps: true,
    // createdAt: 'created_at',
    // updatedAt: 'updated_at'
  });

  Ruta_frecuente.associate = (models) => {
    Ruta_frecuente.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
  };

  return Ruta_frecuente;
};