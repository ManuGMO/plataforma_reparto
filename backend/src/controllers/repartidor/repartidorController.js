// controllers/repartidorController.js
import db from '../../models/indexModels.js';
import { Op } from 'sequelize';
import { calcularRuta } from '../../services/routeService.js';


const { sequelize, Pedido, Usuario, Producto, pedido_repartidor, Producto_Pedido, pedido_comprador, pedido_vendedor } = db;

export const asignarRepartidor = async (req, res) => {
  try {
    const { pedidoId, repartidorId } = req.body;

    const pedido = await db.Pedido.findByPk(pedidoId);
    const repartidor = await db.Usuario.findByPk(repartidorId);

    // Calcular ruta y tiempo estimado
    const ruta = await calcularRuta(
      repartidor.latitud_actual,
      repartidor.longitud_actual,
      pedido.latitud,
      pedido.longitud
    );

    await pedido.update({
      tiene_repartidor: true,
      tiempo_estimado_entrega: Math.ceil(ruta.duracion / 60), // minutos
      distancia_entrega: Math.ceil(ruta.distancia / 1000) // km
    });

    res.json({
      success: true,
      ruta,
      tiempo_estimado: `${Math.ceil(ruta.duracion / 60)} minutos`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const obtenerPedidosDisponibles = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: {
        estado: ['aceptado', 'listo_para_recoger']
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

    console.log('Pedidos disponibles:', pedidos);


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
    // Buscar pedidos en estados que indiquen que están listos para ser tomados o en curso
    const pedidosDisponibles = await Pedido.findAll({
      where: {
        estado: ['aceptado', 'listo_para_recoger', 'en_reparto']
      },
      include: [
        {
          model: Usuario,
          as: 'Repartidor',
          required: false,
          through: {
            attributes: []
          }
        },
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'],
          through: {
            attributes: []
          }
        },
        {
          model: Usuario,
          as: 'Vendedor',
          attributes: ['id_usuario', 'nombre', 'correo', 'latitud', 'longitud'],
          through: {
            attributes: []
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

    // Filtrar pedidos para procesar: queremos incluir
    // - pedidos sin repartidor asignado (disponibles)
    // - pedidos que ya están asignados al repartidor solicitante (para que el propio repartidor vea sus pedidos)
    // Como Repartidor es un array (belongsToMany), verificamos su contenido
    const pedidosSinRepartidor = pedidosDisponibles.filter(pedido => {
      if (!pedido.Repartidor || pedido.Repartidor.length === 0) return true;
      // si tiene repartidores, incluir sólo si uno de ellos es el repartidor que solicita
      try {
        const asignados = pedido.Repartidor || [];
        const asignadoAlSolicitante = asignados.some(r => Number(r.id_usuario) === Number(repartidorId));
        return asignadoAlSolicitante;
      } catch (e) {
        return false;
      }
    });

    // Cargar rutas activas del repartidor (si existen) para filtrado
    const rutas = await db.Ruta_frecuente.findAll({ where: { id_usuario: repartidorId, activa: true } });


    // umbral en metros: puede venir por query param `maxDistance` (preferencia del repartidor)
    // si no se entrega, se usa la variable de entorno o 1000m por defecto
    const ROUTE_MAX_DISTANCE_METERS = Number(req.query.maxDistance || process.env.ROUTE_MAX_DISTANCE_METERS || 1000);
    console.log(`[repartidor] usando ROUTE_MAX_DISTANCE_METERS=${ROUTE_MAX_DISTANCE_METERS} (query:${req.query.maxDistance})`);

    console.log(`[repartidor] repartidorId=${repartidorId} pedidosTotales=${pedidosDisponibles.length} pedidosSinRepartidor=${pedidosSinRepartidor.length} rutasEncontradas=${rutas.length} ROUTE_MAX_DISTANCE_METERS=${ROUTE_MAX_DISTANCE_METERS}`);

    // Mostrar detalle de rutas para depuración (id y coords)
    try {
      const rutasDebug = (rutas || []).map(r => ({ id_ruta: r.id_ruta, origen_lat: r.origen_lat, origen_lng: r.origen_lng, destino_lat: r.destino_lat, destino_lng: r.destino_lng, hora_inicio: r.hora_inicio, hora_fin: r.hora_fin }));
      console.log(`[repartidor][debug] rutasEncontradas detalle:`, JSON.stringify(rutasDebug));
    } catch (e) {
      console.log('[repartidor][debug] error al formatear rutas para debug', e);
    }

    // Medir tiempos para detectar cuellos de botella
    console.time(`[repartidor] tiempo_total_getPedidosDisponibles_${repartidorId}`);
    console.time(`[repartidor] tiempo_db_findAll_${repartidorId}`);

    // helpers de distancia
    const toRad = (v) => (v * Math.PI) / 180;
    const Rm = 6371000; // metros
    const haversine = (lat1, lon1, lat2, lon2) => {
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Rm * c;
    };

    // distancia punto-segmento (aprox en metros usando proyección equirectangular)
    const pointToSegmentDistance = (plat, plong, aLat, aLon, bLat, bLon) => {
      const lat0 = (aLat + bLat + plat) / 3;
      const kx = Math.cos(toRad(lat0)) * (Math.PI / 180) * Rm;
      const ky = (Math.PI / 180) * Rm;
      const px = plong * kx, py = plat * ky;
      const ax = aLon * kx, ay = aLat * ky;
      const bx = bLon * kx, by = bLat * ky;
      const vx = bx - ax, vy = by - ay;
      const wx = px - ax, wy = py - ay;
      const c1 = vx * wx + vy * wy;
      const c2 = vx * vx + vy * vy;
      let t = 0;
      if (c2 > 0) t = Math.max(0, Math.min(1, c1 / c2));
      const projx = ax + t * vx;
      const projy = ay + t * vy;
      const dx = px - projx, dy = py - projy;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // parse horario HH:MM -> minutos
    const minutesOfDay = (hhmm) => {
      if (!hhmm) return null;
      const parts = hhmm.split(':');
      const h = parseInt(parts[0] || '0', 10);
      const m = parseInt(parts[1] || '0', 10);
      return h * 60 + m;
    };

    const isOrderInRouteWindow = (orderDate, ruta) => {
      try {
        const horaPedidoMin = orderDate ? (new Date(orderDate)).getHours() * 60 + (new Date(orderDate)).getMinutes() : null;
        const inicio = minutesOfDay(ruta.hora_inicio?.substring(0, 5));
        const fin = minutesOfDay(ruta.hora_fin?.substring(0, 5));
        if (inicio == null || fin == null) return true; // si no hay horario, aceptar
        if (inicio <= fin) return horaPedidoMin >= inicio && horaPedidoMin <= fin;
        return horaPedidoMin >= inicio || horaPedidoMin <= fin;
      } catch (e) { return true; }
    };

    // Formatear la respuesta para que sea más fácil de usar en el frontend
    const pedidosFormateados = pedidosSinRepartidor.map(pedido => ({
      id_pedido: pedido.id_pedido,
      tiene_repartidor: pedido.tiene_repartidor,
      direccion: pedido.direccion,
      total: pedido.total,
      precio_bruto: pedido.precio_bruto || 0,
      comision_servicio: pedido.comision_servicio || 0,
      pago_reparto: pedido.pago_reparto || 0,
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

    console.timeEnd(`[repartidor] tiempo_db_findAll_${repartidorId}`);

    // Si no hay rutas, devolvemos todo sin filtrar (evitamos esconder pedidos)
    let finalList = pedidosFormateados;
    if (Array.isArray(rutas) && rutas.length > 0) {
      // Preprocesar rutas para evitar parseos repetidos dentro de bucles
      const processedRutas = rutas.map(r => {
        const aLat = Number(r.origen_lat);
        const aLon = Number(r.origen_lng);
        const bLat = Number(r.destino_lat);
        const bLon = Number(r.destino_lng);
        const inicio = minutesOfDay(r.hora_inicio?.substring(0, 5));
        const fin = minutesOfDay(r.hora_fin?.substring(0, 5));
        return { id_ruta: r.id_ruta, aLat, aLon, bLat, bLon, inicio, fin, raw: r };
      }).filter(r => ![r.aLat, r.aLon, r.bLat, r.bLon].some(x => x == null || isNaN(Number(x))));

      console.time(`[repartidor] tiempo_filtrado_${repartidorId}`);

      finalList = pedidosFormateados.filter(p => {
        try {
          const v = p.vendedor;
          const c = p.comprador;
          // requerimos coordenadas del vendedor y del comprador/pedido para esta comprobación
          const hasVendorCoords = v && v.latitud != null && v.longitud != null;
          const hasBuyerCoords = (p.latitud != null && p.longitud != null) || (c && c.latitud != null && c.longitud != null);
          if (!hasVendorCoords || !hasBuyerCoords) {
            console.log(`[repartidor] excluir pedido ${p.id_pedido} por falta de coords (vendor:${!!hasVendorCoords} buyer:${!!hasBuyerCoords})`);
            return false;
          }
          const vlat = Number(v.latitud); const vlng = Number(v.longitud);
          const blat = p.latitud != null ? Number(p.latitud) : Number(c.latitud);
          const blng = p.longitud != null ? Number(p.longitud) : Number(c.longitud);

          // Calcular hora del pedido una sola vez
          const horaPedidoMin = p.fecha_creacion ? (new Date(p.fecha_creacion)).getHours() * 60 + (new Date(p.fecha_creacion)).getMinutes() : null;
          // calcular distancia mínima a cualquiera de las rutas para vendedor y comprador
          let minDistVendor = Infinity;
          let minDistBuyer = Infinity;
          for (const ruta of processedRutas) {
            const dVendor = pointToSegmentDistance(vlat, vlng, ruta.aLat, ruta.aLon, ruta.bLat, ruta.bLon);
            const dBuyer = pointToSegmentDistance(blat, blng, ruta.aLat, ruta.aLon, ruta.bLat, ruta.bLon);
            if (dVendor < minDistVendor) minDistVendor = dVendor;
            if (dBuyer < minDistBuyer) minDistBuyer = dBuyer;

            const dentroUmbralVendor = dVendor <= ROUTE_MAX_DISTANCE_METERS;
            const dentroUmbralBuyer = dBuyer <= ROUTE_MAX_DISTANCE_METERS;

            const inicio = ruta.inicio;
            const fin = ruta.fin;
            const dentroHorario = (() => {
              try {
                if (inicio == null || fin == null) return true;
                if (horaPedidoMin == null) return true;
                if (inicio <= fin) return horaPedidoMin >= inicio && horaPedidoMin <= fin;
                return horaPedidoMin >= inicio || horaPedidoMin <= fin;
              } catch (e) { return true; }
            })();

            console.log(`[repartidor][debug] pedido=${p.id_pedido} ruta=${ruta.id_ruta} dv=${Math.round(dVendor)}m db=${Math.round(dBuyer)}m dentroV=${dentroUmbralVendor} dentroB=${dentroUmbralBuyer} horaPedidoMin=${horaPedidoMin} inicio=${inicio} fin=${fin} dentroHorario=${dentroHorario}`);

            // Aceptar sólo si ambas (vendor y buyer) están dentro del umbral y opcionalmente dentro del horario
            if (dentroUmbralVendor && dentroUmbralBuyer) {
              p.vendor_distance_to_route_meters = Math.round(dVendor);
              p.buyer_distance_to_route_meters = Math.round(dBuyer);
              console.log(`[repartidor] aceptar pedido ${p.id_pedido} dv=${Math.round(dVendor)}m db=${Math.round(dBuyer)}m ruta=${ruta.id_ruta}`);
              return true;
            }
          }
          // si no cumple con ninguna ruta, excluir y dejar las distancias mínimas para debug
          p.vendor_distance_to_route_meters = isFinite(minDistVendor) ? Math.round(minDistVendor) : null;
          p.buyer_distance_to_route_meters = isFinite(minDistBuyer) ? Math.round(minDistBuyer) : null;
          console.log(`[repartidor] excluir pedido ${p.id_pedido} minDistVendor=${p.vendor_distance_to_route_meters}m minDistBuyer=${p.buyer_distance_to_route_meters}m`);
          return false;
        } catch (e) {
          console.error('[repartidor] error filtrando pedido', p.id_pedido, e);
          return false;
        }
      });
      console.timeEnd(`[repartidor] tiempo_filtrado_${repartidorId}`);
    }

    console.timeEnd(`[repartidor] tiempo_total_getPedidosDisponibles_${repartidorId}`);

    // Log final: ids aceptados y rechazados para facilitar verificación
    try {
      const aceptados = (finalList || []).map(p => p.id_pedido);
      const rechazados = pedidosFormateados.filter(p => !aceptados.includes(p.id_pedido)).map(p => ({ id_pedido: p.id_pedido, vendor_distance_to_route_meters: p.vendor_distance_to_route_meters }));
      console.log(`[repartidor] resultado filtro repartidorId=${repartidorId} aceptados=${aceptados.length} ids=${JSON.stringify(aceptados)} rechazados=${rechazados.length}`);
      console.log('[repartidor][debug] rechazados detalle (id,dist):', JSON.stringify(rechazados));
    } catch (e) { console.log('[repartidor][debug] error al loggear resultados finales', e); }

    res.json({ success: true, count: finalList.length, data: finalList });

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
      precio_bruto: pedido.precio_bruto || 0,
      comision_servicio: pedido.comision_servicio || 0,
      pago_reparto: pedido.pago_reparto || 0,
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

    // Formatear respuesta con desglose monetario para el repartidor
    const p = pedidoActualizado;
    const pedidoFormateado = {
      id_pedido: p.id_pedido,
      estado: p.estado,
      tiene_repartidor: p.tiene_repartidor,
      direccion: p.direccion,
      fecha_creacion: p.fecha_creacion,
      total: p.total,
      precio_bruto: p.precio_bruto || 0,
      comision_servicio: p.comision_servicio || 0,
      pago_reparto: p.pago_reparto || 0,
      Comprador: p.Comprador,
      Vendedor: p.Vendedor,
      Repartidor: p.Repartidor,
      Productos: p.Productos
    };

    return res.json({
      success: true,
      message: 'Pedido aceptado para reparto',
      pedido: pedidoFormateado
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
        tiene_repartidor: true,
        total: pedido.total,
        precio_bruto: pedido.precio_bruto || 0,
        comision_servicio: pedido.comision_servicio || 0,
        pago_reparto: pedido.pago_reparto || 0
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
        hora_entrega: new Date().toTimeString().slice(0, 8),
        total: pedido.total,
        precio_bruto: pedido.precio_bruto || 0,
        comision_servicio: pedido.comision_servicio || 0,
        pago_reparto: pedido.pago_reparto || 0
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
    const { filter = 'today', from, to } = req.query;

    // Verificar que el repartidor existe
    const repartidor = await Usuario.findByPk(repartidorId);
    if (!repartidor) {
      return res.status(404).json({
        error: 'Repartidor no encontrado'
      });
    }

    // Calcular fechas según el filtro o por rango explicitado
    let fechaDesde = new Date();
    let fechaHasta = new Date();

    if (from && to) {
      // Si el cliente envía un rango explícito, usarlo
      fechaDesde = new Date(from);
      fechaDesde.setHours(0, 0, 0, 0);
      fechaHasta = new Date(to);
      fechaHasta.setHours(23, 59, 59, 999);
    } else {
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
    }

    // Obtener entregas del repartidor en el período especificado (filtrando por fecha_entrega)
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
        },
        {
          model: db.Valoracion,
          required: false,
          where: { tipo: 'comprador_a_repartidor' },
          attributes: ['calificacion', 'comentario']
        }
      ],
      where: {
        estado: 'entregado',
        fecha_entrega: {
          [Op.between]: [fechaDesde, fechaHasta]
        }
      },
      order: [['fecha_creacion', 'DESC']]
    });

    // Calcular estadísticas
    const entregasCompletadas = entregas.filter(e => e.estado === 'entregado');
    const entregasCanceladas = entregas.filter(e => e.estado === 'cancelado');

    const totalEarnings = entregasCompletadas.reduce((sum, e) => sum + parseInt(e.pago_reparto || e.total || 0), 0);

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

    // Map entregas to include monetary breakdown for frontend
    const entregasFormateadas = entregas.map(e => ({
      id_pedido: e.id_pedido,
      estado: e.estado,
      fecha_creacion: e.fecha_creacion,
      total: e.total,
      precio_bruto: e.precio_bruto || 0,
      comision_servicio: e.comision_servicio || 0,
      pago_reparto: e.pago_reparto || 0,
      pago_reparto: e.pago_reparto || 0,
      Comprador: e.Comprador,
      Vendedor: e.Vendedor,
      Productos: e.Productos,
      valoracion: e.Valoracions && e.Valoracions.length > 0 ? e.Valoracions[0] : null
    }));

    res.json({
      deliveries: entregasFormateadas,
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

    // Formatear pedidos activos para incluir desglose
    const activosFormateados = pedidosActivos.map(p => ({
      id_pedido: p.id_pedido,
      estado: p.estado,
      fecha_creacion: p.fecha_creacion,
      total: p.total,
      precio_bruto: p.precio_bruto || 0,
      comision_servicio: p.comision_servicio || 0,
      pago_reparto: p.pago_reparto || 0,
      Comprador: p.Comprador,
      Vendedor: p.Vendedor,
      Productos: p.Productos
    }));

    res.json(activosFormateados);
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