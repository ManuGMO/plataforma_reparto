import db from "../../models/indexModels.js";
import { Op, fn, col, literal } from "sequelize";

const { Usuario, Bloqueo, pedido_vendedor, pedido_repartidor, Pedido, Valoracion } = db;


// ✅ Obtener repartidores que hayan coincidido con el vendedor en pedidos
export const getRepartidores = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID del vendedor", id);
    
    // Buscar todos los pedidos de ese vendedor
    const pedidosVendedor = await pedido_vendedor.findAll({
      where: { id_usuario: id },
      attributes: ["id_pedido"],
    });
    
    const idsPedidos = pedidosVendedor.map(p => p.id_pedido);
    console.log("IDs de pedidos del vendedor: ", idsPedidos);
    
    if (idsPedidos.length === 0) {
      return res.json([]); // El vendedor no tiene pedidos aún
    }
    
    // Buscar repartidores que hayan participado en esos mismos pedidos
    const repartidores = await Usuario.findAll({
      include: [
        {
          model: Pedido,
          as: "PedidosRepartidor",
          through: { 
            attributes: [],
            where: {
              id_pedido: {
                [Op.in]: idsPedidos // Solo pedidos que coincidan con el vendedor
              }
            }
          },
          attributes: [], // No traemos atributos del pedido
          required: true, // INNER JOIN - solo usuarios que tengan pedidos
        },
        {
          model: Valoracion,
          as: "ValoracionesRecibidas",
          attributes: [],
          required: false, // LEFT JOIN - puede no tener valoraciones
        },
        {
          model: Bloqueo,
          as: "BloqueoRecibido",
          attributes: ["motivo", "id_bloqueo"],
          required: false, // LEFT JOIN - puede no estar bloqueado
          where: {
            id_bloqueador: id // Solo bloqueos hechos por este vendedor
          }
        },
      ],
      attributes: [
        "id_usuario",
        "nombre",
        [fn("COUNT", fn("DISTINCT", col("PedidosRepartidor.id_pedido"))), "totalPedidos"],
        [fn("ROUND", fn("AVG", col("ValoracionesRecibidas.calificacion")), 2), "promedioCalificacion"],
      ],
      group: ["Usuario.id_usuario", "Usuario.nombre", "BloqueoRecibido.id_bloqueo"], // Agregar bloqueo al GROUP BY
      having: literal("COUNT(DISTINCT `PedidosRepartidor`.`id_pedido`) > 0"), // Solo repartidores con pedidos
    });
    
    // Formatear la respuesta para asegurar tipos correctos
    const repartidoresFormateados = repartidores.map(repartidor => {
      const bloqueado = repartidor.BloqueoRecibido && repartidor.BloqueoRecibido.length > 0;
      const motivoBloqueo = bloqueado ? repartidor.BloqueoRecibido[0].motivo : null;
      
      return {
        id_usuario: repartidor.id_usuario,
        nombre: repartidor.nombre,
        totalPedidos: parseInt(repartidor.dataValues.totalPedidos) || 0,
        promedioCalificacion: parseFloat(repartidor.dataValues.promedioCalificacion) || null,
        bloqueado: bloqueado,
        motivoBloqueo: motivoBloqueo
      };
    });
    
    res.json(repartidoresFormateados);
    
  } catch (error) {
    console.error("Error al obtener repartidores:", error);
    res.status(500).json({ 
      error: "Error al obtener repartidores",
      details: error.message 
    });
  }
};


//obtener valoraciones de repartidores
export const getValoracionesRepartidor = async (req, res) => {
  try {
    const { idRepartidor, idVendedor } = req.params;
   
    console.log("Obteniendo valoraciones para:", { idRepartidor, idVendedor });
   
    // Primero, obtener los pedidos donde coincidieron vendedor y repartidor
    const pedidosVendedor = await pedido_vendedor.findAll({
      where: { id_usuario: idVendedor },
      attributes: ["id_pedido"],
    });
   
    const idsPedidosVendedor = pedidosVendedor.map(p => p.id_pedido);
   
    if (idsPedidosVendedor.length === 0) {
      return res.json({ valoraciones: [], estadisticas: null });
    }
   
    // Buscar pedidos donde también participó el repartidor
    const pedidosCompartidos = await pedido_repartidor.findAll({
      where: {
        id_usuario: idRepartidor,
        id_pedido: {
          [Op.in]: idsPedidosVendedor
        }
      },
      attributes: ["id_pedido"],
    });
   
    const idsPedidosCompartidos = pedidosCompartidos.map(p => p.id_pedido);
   
    // OPCIÓN SIMPLE: Obtener todas las valoraciones del repartidor sin filtrar por pedidos compartidos
    const valoraciones = await Valoracion.findAll({
      where: {
        id_usuario_evaluado: idRepartidor,
        tipo: 'comprador_a_repartidor'
      },
      include: [
        {
          model: Usuario,
          as: 'Comprador',
          attributes: ['nombre']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: 50
    });

    let valoracionesFiltradas = valoraciones;
   
    // Calcular estadísticas
    const estadisticas = {
      totalValoraciones: valoracionesFiltradas.length,
      promedioCalificacion: valoracionesFiltradas.length > 0
        ? parseFloat((valoracionesFiltradas.reduce((sum, v) => sum + v.calificacion, 0) / valoracionesFiltradas.length).toFixed(2))
        : null,
      distribucionCalificaciones: {
        5: valoracionesFiltradas.filter(v => v.calificacion === 5).length,
        4: valoracionesFiltradas.filter(v => v.calificacion === 4).length,
        3: valoracionesFiltradas.filter(v => v.calificacion === 3).length,
        2: valoracionesFiltradas.filter(v => v.calificacion === 2).length,
        1: valoracionesFiltradas.filter(v => v.calificacion === 1).length,
      },
      pedidosCompartidos: idsPedidosCompartidos.length
    };
   
    // Formatear valoraciones
    const valoracionesFormateadas = valoracionesFiltradas.map(valoracion => ({
      id_valoracion: valoracion.id_valoracion,
      calificacion: valoracion.calificacion,
      comentario: valoracion.comentario,
      fecha: valoracion.fecha,
      nombreComprador: valoracion.Comprador?.nombre || 'Usuario anónimo',
      id_pedido: valoracion.id_pedido || null
    }));
   
    res.json({
      valoraciones: valoracionesFormateadas,
      estadisticas
    });
   
  } catch (error) {
    console.error("Error al obtener valoraciones del repartidor:", error);
    res.status(500).json({
      error: "Error al obtener valoraciones",
      details: error.message
    });
  }
};



// Bloquear repartidor
export const bloquearRepartidor = async (req, res) => {
  try {
    const { id } = req.params; // id del repartidor a bloquear
    const { id_bloqueador, motivo } = req.body; // Cambié idBloqueador por id_bloqueador
    
    console.log("Datos recibidos:", { id, id_bloqueador, motivo });
    
    // Verificar que exista el repartidor
    const repartidor = await Usuario.findByPk(id);
    if (!repartidor) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Verificar que exista el bloqueador
    const bloqueador = await Usuario.findByPk(id_bloqueador);
    if (!bloqueador) {
      return res.status(404).json({ message: "Usuario bloqueador no encontrado" });
    }
    
    // Verificar si ya existe un bloqueo
    const bloqueoExistente = await Bloqueo.findOne({
      where: {
        id_bloqueado: id,
        id_bloqueador: id_bloqueador
      }
    });
    
    if (bloqueoExistente) {
      return res.status(400).json({ message: "Este usuario ya está bloqueado" });
    }
    
    // Crear registro de bloqueo
    const bloqueo = await Bloqueo.create({
      id_bloqueado: id,
      id_bloqueador: id_bloqueador,
      motivo: motivo || "Sin motivo especificado"
    });
    
    res.status(201).json({
      message: "Usuario bloqueado exitosamente",
      bloqueo: {
        id_bloqueo: bloqueo.id_bloqueo,
        id_bloqueado: bloqueo.id_bloqueado,
        id_bloqueador: bloqueo.id_bloqueador,
        motivo: bloqueo.motivo,
        usuario_bloqueado: repartidor.nombre
      }
    });
    
  } catch (error) {
    console.error("Error bloqueando usuario:", error);
    res.status(500).json({ 
      message: "Error en el servidor",
      error: error.message 
    });
  }
};

export const desbloquearRepartidor = async (req, res) => {
  try {
    const { id } = req.params; // id del repartidor a desbloquear
    const { id_bloqueador } = req.body;
    
    console.log("Desbloqueando:", { id, id_bloqueador });
    
    // Buscar y eliminar el bloqueo
    const bloqueoEliminado = await Bloqueo.destroy({
      where: {
        id_bloqueado: id,
        id_bloqueador: id_bloqueador
      }
    });
    
    if (bloqueoEliminado === 0) {
      return res.status(404).json({ message: "No se encontró el bloqueo" });
    }
    
    res.json({
      message: "Usuario desbloqueado exitosamente"
    });
    
  } catch (error) {
    console.error("Error desbloqueando usuario:", error);
    res.status(500).json({ 
      message: "Error en el servidor",
      error: error.message 
    });
  }
};

// Obtener repartidores cercanos a un vendedor (por distancia en metros)
export const getRepartidoresCercanos = async (req, res) => {
  try {

    console.log("Entrando a getRepartidoresCercanos");
    const { idVendedor, umbral } = req.params;
    const threshold = Number(umbral || process.env.ROUTE_MAX_DISTANCE_METERS || 1000);

    console.log(`Obteniendo repartidores cercanos para vendedorId=${idVendedor} con umbral=${threshold} metros`);
    // Obtener vendedor
    const vendedor = await Usuario.findByPk(idVendedor, { attributes: ['id_usuario', 'nombre', 'latitud', 'longitud'] });
    if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' });
    if (vendedor.latitud == null || vendedor.longitud == null) return res.status(400).json({ error: 'Vendedor sin coordenadas' });
 
    
    // (se usan funciones de distancia más abajo)

    // Obtener ids de usuarios que tengan el rol repartidor (id_rol = 3)
    const repartidorRows = await db.Usuario_Rol.findAll({ where: { id_rol: 3 }, attributes: ['id_usuario'], raw: true });
    const repartidorIds = repartidorRows.map(r => r.id_usuario);
    if (!repartidorIds || repartidorIds.length === 0) {
      console.log(`[vendedor] vendedorId=${idVendedor} repartidoresEncontrados=0 ids=[] (no hay usuarios con id_rol=3)`);
      return res.json({ success: true, count: 0, data: [] });
    }

    console.log("repartidorIds obtenidos:", repartidorIds);
    
    // Buscar usuarios que sean repartidores por id e incluir sus rutas activas
    const posibles = await Usuario.findAll({
      include: [
        {
          model: db.Ruta_frecuente,
          where: { activa: true },
          required: false
        }
      ],
      where: {
        id_usuario: { [Op.in]: repartidorIds }
      },
      attributes: ['id_usuario', 'nombre', 'latitud', 'longitud']
    });

    console.log(`[vendedor][debug] posibles recuperados=${posibles.length} (filtrados por rol y coords)`);
    // Mostrar ids y disponibilidad de rutas para depuración
    posibles.forEach(pp => {
      const rutasCount = (pp.Ruta_frecuentes && pp.Ruta_frecuentes.length) || 0;
      console.log(`[vendedor][debug] posible id=${pp.id_usuario} lat=${pp.latitud} lng=${pp.longitud} rutasActivas=${rutasCount}`);
      if (rutasCount > 0) {
        // mostrar la primera ruta para inspección
        const r = pp.Ruta_frecuentes[0];
        console.log(`[vendedor][debug] ejemplo ruta id=${r.id_ruta} origen=(${r.origen_lat},${r.origen_lng}) destino=(${r.destino_lat},${r.destino_lng}) dia=${r.dia} activa=${r.activa}`);
      }
    });

    // distancia punto-segmento (aprox en metros usando proyección equirectangular)
    const toRad = (v) => (v * Math.PI) / 180;
    const Rm = 6371000; // metros
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

    const vendedorLat = Number(vendedor.latitud);
    const vendedorLng = Number(vendedor.longitud);

    const cercanos = [];
    for (const p of posibles) {
      try {
        const rutas = p.Ruta_frecuentes || [];
        let minDist = Infinity;
        for (const ruta of rutas) {
          const aLat = Number(ruta.origen_lat);
          const aLon = Number(ruta.origen_lng);
          const bLat = Number(ruta.destino_lat);
          const bLon = Number(ruta.destino_lng);
          if ([aLat, aLon, bLat, bLon].some(x => x == null || isNaN(Number(x)))) continue;
          const d = pointToSegmentDistance(vendedorLat, vendedorLng, aLat, aLon, bLat, bLon);
          if (d < minDist) minDist = d;
        }
        if (minDist <= threshold) {
          cercanos.push({ id_usuario: p.id_usuario, nombre: p.nombre, latitud: p.latitud, longitud: p.longitud, distancia_m: Math.round(minDist) });
        }
      } catch (e) {
        console.error('Error procesando repartidor', p.id_usuario, e);
      }
    }

    cercanos.sort((a,b) => a.distancia_m - b.distancia_m);
    // Log para depuración: IDs de repartidores encontrados
    const ids = cercanos.map(r => r.id_usuario);
    console.log(`[vendedor] vendedorId=${idVendedor} repartidoresEncontrados=${cercanos.length} ids=[${ids.join(',')}]`);
    res.json({ success: true, count: cercanos.length, data: cercanos });
  } catch (error) {
    console.error('Error al obtener repartidores cercanos:', error);
    res.status(500).json({ error: 'Error interno', message: error.message });
  }
};