import db from "../../models/indexModels.js";
import { Op } from "sequelize";

// Obtener todas las rutas de un repartidor
export const getRutasPorRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;
    
    const rutas = await db.Ruta_frecuente.findAll({
      where: { 
        id_usuario: repartidorId,
        activa: true // Solo rutas activas
      },
      order: [
        ["dia", "ASC"],
        ["hora_inicio", "ASC"],
      ],
    });
    
    res.json(rutas);
  } catch (error) {
    console.error("❌ Error obteniendo rutas:", error);
    res.status(500).json({ error: "Error al obtener las rutas" });
  }
};

// Crear nueva ruta
export const crearRuta = async (req, res) => {
  try {
    const { 
      id_usuario, 
      nombre_ruta,
      origen, 
      origen_lat, 
      origen_lng,
      destino, 
      destino_lat, 
      destino_lng,
      hora_inicio, 
      hora_fin,
      dia,
      ruta_geojson
    } = req.body;

    // Validar datos requeridos
    if (!id_usuario || !origen || !destino || !hora_inicio || !hora_fin || !dia) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Validar coordenadas
    if (!origen_lat || !origen_lng || !destino_lat || !destino_lng) {
      return res.status(400).json({ error: "Faltan coordenadas de origen o destino" });
    }

    // Validar día
    const diasValidos = [
      "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"
    ];
    if (!diasValidos.includes(dia)) {
      return res.status(400).json({ error: "Día inválido" });
    }

    // Validar que hora_fin sea mayor que hora_inicio
    if (hora_fin <= hora_inicio) {
      return res.status(400).json({ 
        error: "La hora de fin debe ser posterior a la hora de inicio" 
      });
    }

    const nuevaRuta = await db.Ruta_frecuente.create({
      id_usuario,
      nombre_ruta: nombre_ruta || `Ruta ${dia}`,
      origen,
      origen_lat,
      origen_lng,
      destino,
      destino_lat,
      destino_lng,
      hora_inicio,
      hora_fin,
      dia,
      ruta_geojson: ruta_geojson || null,
      activa: true
    });

    res.status(201).json(nuevaRuta);
  } catch (error) {
    console.error("❌ Error creando ruta:", error);
    res.status(500).json({ error: "Error al crear la ruta" });
  }
};

// Actualizar ruta existente
export const actualizarRuta = async (req, res) => {
  try {
    const { idRuta } = req.params;
    const { 
      nombre_ruta,
      origen, 
      origen_lat, 
      origen_lng,
      destino, 
      destino_lat, 
      destino_lng,
      hora_inicio, 
      hora_fin,
      dia,
      ruta_geojson,
      activa
    } = req.body;

    const ruta = await db.Ruta_frecuente.findByPk(idRuta);

    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    // Validar día si se proporciona
    if (dia) {
      const diasValidos = [
        "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"
      ];
      if (!diasValidos.includes(dia)) {
        return res.status(400).json({ error: "Día inválido" });
      }
    }

    // Validar horarios si se proporcionan ambos
    const horaInicioFinal = hora_inicio || ruta.hora_inicio;
    const horaFinFinal = hora_fin || ruta.hora_fin;
    
    if (horaFinFinal <= horaInicioFinal) {
      return res.status(400).json({ 
        error: "La hora de fin debe ser posterior a la hora de inicio" 
      });
    }

    await ruta.update({
      nombre_ruta: nombre_ruta !== undefined ? nombre_ruta : ruta.nombre_ruta,
      origen: origen || ruta.origen,
      origen_lat: origen_lat || ruta.origen_lat,
      origen_lng: origen_lng || ruta.origen_lng,
      destino: destino || ruta.destino,
      destino_lat: destino_lat || ruta.destino_lat,
      destino_lng: destino_lng || ruta.destino_lng,
      hora_inicio: hora_inicio || ruta.hora_inicio,
      hora_fin: hora_fin || ruta.hora_fin,
      dia: dia || ruta.dia,
      ruta_geojson: ruta_geojson !== undefined ? ruta_geojson : ruta.ruta_geojson,
      activa: activa !== undefined ? activa : ruta.activa
    });

    res.json(ruta);
  } catch (error) {
    console.error("❌ Error actualizando ruta:", error);
    res.status(500).json({ error: "Error al actualizar la ruta" });
  }
};

// Eliminar ruta (soft delete - marcar como inactiva)
export const eliminarRuta = async (req, res) => {
  try {
    const { idRuta } = req.params;
    
    const ruta = await db.Ruta_frecuente.findByPk(idRuta);

    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    // Soft delete - marcar como inactiva
    await ruta.update({ activa: false });

    res.json({ message: "Ruta desactivada correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando ruta:", error);
    res.status(500).json({ error: "Error al eliminar la ruta" });
  }
};

// Obtener rutas activas para un día y hora específicos
export const getRutasActivas = async (req, res) => {
  try {
    const { repartidorId, dia, hora } = req.params;

    const rutas = await db.Ruta_frecuente.findAll({
      where: {
        id_usuario: repartidorId,
        dia,
        activa: true,
        hora_inicio: {
          [Op.lte]: hora // Hora de inicio <= hora actual
        },
        hora_fin: {
          [Op.gte]: hora // Hora de fin >= hora actual
        }
      },
      order: [["hora_inicio", "ASC"]]
    });

    res.json(rutas);
  } catch (error) {
    console.error("❌ Error obteniendo rutas activas:", error);
    res.status(500).json({ error: "Error al obtener rutas activas" });
  }
};

// Nuevo: Obtener negocios cercanos a una ruta
export const getNegociosCercanosARuta = async (req, res) => {
  try {
    const { idRuta } = req.params;
    const { radioKm = 2 } = req.query; // Radio en kilómetros (default: 2km)

    const ruta = await db.Ruta_frecuente.findByPk(idRuta);
    
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    // Calcular negocios dentro del radio de la ruta
    // Esta es una consulta simplificada - en producción usarías PostGIS o similar
    const negocios = await db.Negocio.findAll({
      where: db.sequelize.literal(
        `(
          6371 * acos(
            cos(radians(${ruta.origen_lat})) * 
            cos(radians(latitud)) * 
            cos(radians(longitud) - radians(${ruta.origen_lng})) + 
            sin(radians(${ruta.origen_lat})) * 
            sin(radians(latitud))
          ) <= ${radioKm}
        ) OR (
          6371 * acos(
            cos(radians(${ruta.destino_lat})) * 
            cos(radians(latitud)) * 
            cos(radians(longitud) - radians(${ruta.destino_lng})) + 
            sin(radians(${ruta.destino_lat})) * 
            sin(radians(latitud))
          ) <= ${radioKm}
        )`
      )
    });

    res.json({
      ruta,
      negocios_cercanos: negocios,
      radio_km: radioKm
    });
  } catch (error) {
    console.error("❌ Error obteniendo negocios cercanos:", error);
    res.status(500).json({ error: "Error al obtener negocios cercanos" });
  }
};