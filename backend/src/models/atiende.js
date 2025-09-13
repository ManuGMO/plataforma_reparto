import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const atiende = sequelize.define('atiende', {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Usuario',
        key: 'id_usuario'
      }
    },
    id_tienda: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Tienda',
        key: 'id_tienda'
      }
    }
  }, {
    tableName: 'atiende',
    timestamps: false
  });

  return atiende;
};
