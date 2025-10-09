module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Pedido', 'fecha_ultimo_cambio_estado', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('Pedido', 'estado_anterior', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('Pedido', 'fecha_estado_anterior', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Pedido', 'fecha_ultimo_cambio_estado');
    await queryInterface.removeColumn('Pedido', 'estado_anterior');
  }
};