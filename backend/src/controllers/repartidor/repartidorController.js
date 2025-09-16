// controllers/repartidorController.js
import db from '../../models/indexModels.js';
import { Op } from 'sequelize';


const { sequelize, Pedido, Usuario, Producto, pedido_repartidor, Producto_Pedido, pedido_comprador, pedido_vendedor } = db;


export const obtenerPedidosDisponibles = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: {
        estado: 'aceptado'
      },
      include: [
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud']
        },
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud']
        },
        {
          model: Producto,
          through: {
            model: Producto_Pedido,
            attributes: ['cantidad']
          },
          attributes: ['nombre', 'precio']
        }
      ]
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos disponibles:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener pedidos asignados a un repartidor
export const obtenerPedidosAsignados = async (req, res) => {
  try {
    const { repartidorId } = req.params;
    
    const pedidos = await Pedido.findAll({
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          where: { id_usuario: repartidorId },
          attributes: ['id_usuario', 'nombre']
        },
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud']
        },
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud']
        },
        {
          model: Producto,
          through: {
            model: Producto_Pedido,
            attributes: ['cantidad']
          },
          attributes: ['nombre', 'precio', 'descripcion']
        }
      ],
      where: {
        estado: ['repartidor_asignado', 'en_reparto']
      }
    });

    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos asignados:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};


// Obtener pedidos disponibles para repartidores
export const getPedidosDisponibles = async (req, res) => {
  try {
    const { repartidorId } = req.params;

    // Buscar pedidos que estén listos para recoger
    const pedidosDisponibles = await Pedido.findAll({
      where: {
        estado: 'aceptado'
      },
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          required: false, // LEFT JOIN para incluir pedidos sin repartidor
          through: {
            attributes: [] // No incluir atributos de la tabla intermedia
          }
        },
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'],
          through: {
            attributes: [] // No incluir atributos de la tabla intermedia
          }
        },
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'],
          through: {
            attributes: [] // No incluir atributos de la tabla intermedia
          }
        },
        {
          model: Producto,
          through: {
            model: Producto_Pedido,
            attributes: ['cantidad']
          },
          attributes: ['id_producto', 'nombre', 'precio']
        }
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: 20
    });

    // Filtrar pedidos que no tengan repartidor asignado
    // Como Repartidor es un array (belongsToMany), verificamos si está vacío
    const pedidosSinRepartidor = pedidosDisponibles.filter(pedido => 
      !pedido.Repartidor || pedido.Repartidor.length === 0
    );

    // Formatear la respuesta para que sea más fácil de usar en el frontend
    const pedidosFormateados = pedidosSinRepartidor.map(pedido => ({
      id_pedido: pedido.id_pedido,
      direccion: pedido.direccion,
      total: pedido.total,
      estado: pedido.estado,
      fecha_creacion: pedido.fecha_creacion,
      fecha_entrega: pedido.fecha_entrega,
      hora_entrega: pedido.hora_entrega,
      latitud: pedido.latitud,
      longitud: pedido.longitud,
      comprador: pedido.Comprador && pedido.Comprador.length > 0 ? {
        id_usuario: pedido.Comprador[0].id_usuario,
        nombre: pedido.Comprador[0].nombre,
        correo: pedido.Comprador[0].correo,
        latitud: pedido.Comprador[0].latitud,
        longitud: pedido.Comprador[0].longitud
      } : null,
      vendedor: pedido.Vendedor && pedido.Vendedor.length > 0 ? {
        id_usuario: pedido.Vendedor[0].id_usuario,
        nombre: pedido.Vendedor[0].nombre,
        correo: pedido.Vendedor[0].correo,
        latitud: pedido.Vendedor[0].latitud,
        longitud: pedido.Vendedor[0].longitud
      } : null,
      productos: pedido.Productos ? pedido.Productos.map(producto => ({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: producto.Producto_Pedido ? producto.Producto_Pedido.cantidad : 0
      })) : []
    }));

    res.json({
      success: true,
      count: pedidosFormateados.length,
      data: pedidosFormateados
    });

  } catch (error) {
    console.error('Error al obtener pedidos disponibles:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Función adicional para obtener pedidos disponibles con una consulta más eficiente
export const getPedidosDisponiblesOptimized = async (req, res) => {
  try {
    const { repartidorId } = req.params;

    // Obtener IDs de pedidos que ya tienen repartidor asignado
    const pedidosConRepartidor = await pedido_repartidor.findAll({
      attributes: ['id_pedido'],
      raw: true
    });
    
    const idsConRepartidor = pedidosConRepartidor.map(item => item.id_pedido);

    // Buscar pedidos que estén listos para recoger y NO tengan repartidor
    const pedidosDisponibles = await Pedido.findAll({
      where: {
        estado: 'listo_para_recoger',
        id_pedido: {
          [Op.notIn]: idsConRepartidor
        }
      },
      include: [
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'],
          through: { attributes: [] }
        },
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'],
          through: { attributes: [] }
        },
        {
          model: Producto,
          through: {
            model: Producto_Pedido,
            attributes: ['cantidad']
          },
          attributes: ['id_producto', 'nombre', 'precio']
        }
      ],
      order: [['fecha_creacion', 'DESC']],
      limit: 20
    });

    // Formatear respuesta
    const pedidosFormateados = pedidosDisponibles.map(pedido => ({
      id_pedido: pedido.id_pedido,
      direccion: pedido.direccion,
      total: pedido.total,
      estado: pedido.estado,
      fecha_creacion: pedido.fecha_creacion,
      fecha_entrega: pedido.fecha_entrega,
      hora_entrega: pedido.hora_entrega,
      latitud: pedido.latitud,
      longitud: pedido.longitud,
      comprador: pedido.Comprador?.[0] || null,
      vendedor: pedido.Vendedor?.[0] || null,
      productos: pedido.Productos?.map(producto => ({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: producto.Producto_Pedido?.cantidad || 0
      })) || []
    }));

    res.json({
      success: true,
      count: pedidosFormateados.length,
      data: pedidosFormateados
    });

  } catch (error) {
    console.error('Error al obtener pedidos disponibles:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Aceptar un pedido como repartidor
export const aceptarPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { pedidoId } = req.params;
    const { id_repartidor } = req.body;

    // Verificar que el repartidor existe
    const repartidor = await Usuario.findByPk(id_repartidor);
    if (!repartidor) {
      throw new Error('Repartidor no encontrado');
    }

    // Verificar que el pedido existe y está disponible
    const pedido = await Pedido.findByPk(pedidoId, {
      include: [{ model: Usuario, as: 'Repartidor' }],
      transaction
    });

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    if (pedido.tiene_repartidor) {
      throw new Error('El pedido ya tiene un repartidor asignado');
    }


    // Asignar repartidor al pedido
    await pedido_repartidor.create(
      { id_pedido: pedidoId, id_usuario: id_repartidor },
      { transaction }
    );

    // Marcar que tiene repartidor asignado
    await pedido.update({ tiene_repartidor: true }, { transaction });

    await transaction.commit();

    // Obtener pedido actualizado con toda la información
    const pedidoActualizado = await Pedido.findByPk(pedidoId, {
      include: [
        { model: Usuario, as: 'Comprador', attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'] },
        { model: Usuario, as: 'Vendedor', attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'] },
        { model: Usuario, as: 'Repartidor', attributes: ['id_usuario', 'nombre', 'correo'] },
        {
          model: Producto,
          through: { model: Producto_Pedido, attributes: ['cantidad'] },
          attributes: ['nombre', 'precio']
        }
      ]
    });

    return res.json({
      success: true,
      message: 'Pedido aceptado para reparto',
      pedido: pedidoActualizado
    });

  } catch (error) {
    if (!transaction.finished) { // 👈 evita rollback doble
      await transaction.rollback();
    }
    console.error('Error al aceptar pedido:', error);
    return res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
};


// Confirmar recogida del pedido (repartidor recoge el pedido del vendedor)
export const confirmarRecogida = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { pedidoId } = req.params;
    const { id_repartidor } = req.body;

    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          attributes: ['id_usuario']
        }
      ],
      transaction
    });

    if (!pedido) {
      throw new Error('Pedido no encontrado');
    }

    // Verificar que el repartidor que intenta confirmar recogida es el asignado al pedido
    const repartidorAsignado = pedido.Repartidor.find(
      (r) => r.id_usuario == id_repartidor
    );
    if (!repartidorAsignado) {
      throw new Error('No tienes permisos para actualizar este pedido');
    }

    // Verificar que el pedido está listo 
    if (pedido.estado !== 'listo_para_recoger') {
      throw new Error(`El pedido no está disponible para ser recogido (estado actual: ${pedido.estado})`);
    }

    // Actualizar estado a en_reparto
    await pedido.update(
      { estado: 'en_reparto' },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Recogida confirmada, pedido en reparto',
      pedido: {
        id_pedido: pedido.id_pedido,
        estado: 'en_reparto',
        tiene_repartidor: true
      }
    });
  } catch (error) {
    if (!transaction.finished) { // 👈 evita rollback doble
      await transaction.rollback();
    }
    console.error('Error al confirmar recogida:', error);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


// Confirmar entrega del pedido
export const confirmarEntrega = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { pedidoId } = req.params;
    const { id_repartidor } = req.body;

    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          attributes: ['id_usuario']
        }
      ],
      transaction
    });

    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Pedido no encontrado' 
      });
    }

    // Verificar que el repartidor que intenta confirmar entrega es el asignado al pedido
    const repartidorAsignado = pedido.Repartidor.find(r => r.id_usuario == id_repartidor);
    if (!repartidorAsignado) {
      await transaction.rollback();
      return res.status(403).json({ 
        error: 'No tienes permisos para actualizar este pedido' 
      });
    }

    // Verificar que el pedido está en reparto
    if (pedido.estado !== 'en_reparto') {
      await transaction.rollback();
      return res.status(400).json({ 
        error: `No se puede confirmar entrega. Estado actual: ${pedido.estado}` 
      });
    }

    // Actualizar estado y fecha/hora de entrega
    await pedido.update({ 
      estado: 'entregado',
      fecha_entrega: new Date(),
      hora_entrega: new Date().toTimeString().slice(0, 8)
    }, { transaction });

    await transaction.commit();

    res.json({ 
      success: true,
      message: 'Entrega confirmada exitosamente',
      pedido: {
        id_pedido: pedido.id_pedido,
        estado: 'entregado',
        tiene_repartidor: true,
        fecha_entrega: new Date(),
        hora_entrega: new Date().toTimeString().slice(0, 8)
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al confirmar entrega:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener entregas de un repartidor
export const getEntregasRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;
    const { filter = 'today' } = req.query;

    // Verificar que el repartidor existe
    const repartidor = await Usuario.findByPk(repartidorId);
    if (!repartidor) {
      return res.status(404).json({ 
        error: 'Repartidor no encontrado' 
      });
    }

    // Calcular fechas según el filtro
    let fechaDesde = new Date();
    let fechaHasta = new Date();
    
    switch (filter) {
      case 'today':
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        break;
      case 'week':
        fechaDesde.setDate(fechaDesde.getDate() - 7);
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        break;
      case 'month':
        fechaDesde.setMonth(fechaDesde.getMonth() - 1);
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        break;
      default:
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
    }

    // Obtener entregas del repartidor en el período especificado
    const entregas = await Pedido.findAll({
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          where: { id_usuario: repartidorId },
          attributes: []
        },
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre', 'correo']
        },
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre', 'correo']
        },
        {
          model: Producto,
          through: {
            model: Producto_Pedido,
            attributes: ['cantidad']
          },
          attributes: ['nombre', 'precio'],
          required: false
        }
      ],
      where: {
        fecha_creacion: {
          [Op.between]: [fechaDesde, fechaHasta]
        }
      },
      order: [['fecha_creacion', 'DESC']]
    });

    // Calcular estadísticas
    const entregasCompletadas = entregas.filter(e => e.estado === 'entregado');
    const entregasCanceladas = entregas.filter(e => e.estado === 'cancelado');
    
    const totalEarnings = entregasCompletadas.reduce((sum, e) => sum + parseInt(e.total || 0), 0);
    
    // Estimación de distancia basada en coordenadas (simulado)
    const distanciaPromedio = 2.5; // km por entrega
    const totalDistance = entregasCompletadas.length * distanciaPromedio;

    const stats = {
      totalDeliveries: entregasCompletadas.length,
      totalCanceled: entregasCanceladas.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalEarnings,
      averageEarningsPerDelivery: entregasCompletadas.length > 0 ? 
        Math.round(totalEarnings / entregasCompletadas.length) : 0
    };

    res.json({
      deliveries: entregas,
      stats,
      period: filter,
      repartidor: {
        id: repartidor.id_usuario,
        nombre: repartidor.nombre
      }
    });
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener estadísticas del repartidor
export const getEstadisticasRepartidor = async (req, res) => {
  try {
    const { repartidorId, periodo } = req.params;

    // Verificar que el repartidor existe
    const repartidor = await Usuario.findByPk(repartidorId);
    if (!repartidor) {
      return res.status(404).json({ 
        error: 'Repartidor no encontrado' 
      });
    }

    let fechaDesde = new Date();
    let fechaHasta = new Date();
    
    switch (periodo) {
      case 'hoy':
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        fechaDesde.setDate(fechaDesde.getDate() - 7);
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        break;
      case 'mes':
        fechaDesde.setMonth(fechaDesde.getMonth() - 1);
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
        break;
      default:
        fechaDesde.setHours(0, 0, 0, 0);
        fechaHasta.setHours(23, 59, 59, 999);
    }

    const entregas = await Pedido.findAll({
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          where: { id_usuario: repartidorId },
          attributes: []
        }
      ],
      where: {
        fecha_creacion: {
          [Op.between]: [fechaDesde, fechaHasta]
        }
      }
    });

    const entregasCompletadas = entregas.filter(e => e.estado === 'entregado');
    const earnings = entregasCompletadas.reduce((sum, e) => sum + parseInt(e.total || 0), 0);
    const deliveries = entregasCompletadas.length;

    // Calcular rating promedio basado en valoraciones (simulado por ahora)
    // En una implementación real, esto vendría de una tabla de valoraciones
    const rating = deliveries > 0 ? (4.5 + Math.random() * 0.5) : 0;

    res.json({
      earnings,
      deliveries,
      rating: Math.round(rating * 10) / 10,
      period: periodo,
      totalOrders: entregas.length,
      successRate: entregas.length > 0 ? 
        Math.round((deliveries / entregas.length) * 100) : 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener pedidos activos de un repartidor
export const getPedidosActivos = async (req, res) => {
  try {
    const { repartidorId } = req.params;

    const pedidosActivos = await Pedido.findAll({
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          where: { id_usuario: repartidorId },
          attributes: []
        },
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['nombre', 'correo', 'latitud', 'longitud']
        },
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['nombre', 'correo', 'latitud', 'longitud']
        },
        {
          model: Producto,
          through: {
            model: Producto_Pedido,
            attributes: ['cantidad']
          },
          attributes: ['nombre', 'precio']
        }
      ],
      where: {
        estado: {
          [Op.in]: ['en_reparto']
        }
      },
      order: [['fecha_creacion', 'ASC']]
    });

    res.json(pedidosActivos);
  } catch (error) {
    console.error('Error al obtener pedidos activos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Cancelar pedido (solo si está en_reparto y hay una razón válida)
export const cancelarPedido = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { pedidoId } = req.params;
    const { id_repartidor, motivo } = req.body;

    const pedido = await Pedido.findByPk(pedidoId, {
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          attributes: ['id_usuario']
        }
      ],
      transaction
    });

    if (!pedido) {
      await transaction.rollback();
      return res.status(404).json({ 
        error: 'Pedido no encontrado' 
      });
    }

    // Verificar que el repartidor que intenta cancelar es el asignado
    const repartidorAsignado = pedido.Repartidor.find(r => r.id_usuario == id_repartidor);
    if (!repartidorAsignado) {
      await transaction.rollback();
      return res.status(403).json({ 
        error: 'No tienes permisos para cancelar este pedido' 
      });
    }

    if (pedido.estado !== 'en_reparto') {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Solo se pueden cancelar pedidos en reparto' 
      });
    }

    // Actualizar estado a cancelado
    await pedido.update({ 
      estado: 'cancelado'
    }, { transaction });

    // Remover la asignación del repartidor para que otro pueda tomarlo
    await pedido_repartidor.destroy({
      where: {
        id_pedido: pedidoId,
        id_usuario: id_repartidor
      },
      transaction
    });

    // Volver el pedido a listo_para_recoger para que otro repartidor pueda tomarlo
    await pedido.update({ 
      estado: 'listo_para_recoger'
    }, { transaction });

    await transaction.commit();

    res.json({ 
      message: 'Pedido cancelado correctamente',
      motivo: motivo || 'No especificado'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};