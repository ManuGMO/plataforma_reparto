import db from "../../models/indexModels.js";
import { Op } from "sequelize";

export const getRutasPorRepartidor = async (req, res) => {
  try {
    const { repartidorId } = req.params;

    const rutas = await db.Ruta_frecuente.findAll({
      where: { id_usuario: repartidorId },
      order: [
        ["dia", "ASC"],
        ["horario", "ASC"],
      ],
    });

    res.json(rutas);
  } catch (error) {
    console.error("❌ Error obteniendo rutas:", error);
    res.status(500).json({ error: "Error al obtener las rutas" });
  }
};

export const crearRuta = async (req, res) => {
  try {
    const { id_usuario, origen, destino, horario, dia } = req.body;

    // Validar datos
    if (!id_usuario || !origen || !destino || !horario || !dia) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const diasValidos = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ];
    if (!diasValidos.includes(dia)) {
      return res.status(400).json({ error: "Día inválido" });
    }

    const nuevaRuta = await db.Ruta_frecuente.create({
      id_usuario,
      origen,
      destino,
      horario,
      dia,
    });

    res.status(201).json(nuevaRuta);
  } catch (error) {
    console.error("❌ Error creando ruta:", error);
    res.status(500).json({ error: "Error al crear la ruta" });
  }
};

export const actualizarRuta = async (req, res) => {
  try {
    const { idRuta } = req.params;
    const { origen, destino, horario, dia } = req.body;

    const ruta = await db.Ruta_frecuente.findByPk(idRuta);
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    // Validar día si se proporciona
    if (dia) {
      const diasValidos = [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo",
      ];
      if (!diasValidos.includes(dia)) {
        return res.status(400).json({ error: "Día inválido" });
      }
    }

    await ruta.update({
      origen: origen || ruta.origen,
      destino: destino || ruta.destino,
      horario: horario || ruta.horario,
      dia: dia || ruta.dia,
    });

    res.json(ruta);
  } catch (error) {
    console.error("❌ Error actualizando ruta:", error);
    res.status(500).json({ error: "Error al actualizar la ruta" });
  }
};

export const eliminarRuta = async (req, res) => {
  try {
    const { idRuta } = req.params;

    const ruta = await db.Ruta_frecuente.findByPk(idRuta);
    if (!ruta) {
      return res.status(404).json({ error: "Ruta no encontrada" });
    }

    await ruta.destroy();

    res.json({ message: "Ruta eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando ruta:", error);
    res.status(500).json({ error: "Error al eliminar la ruta" });
  }
};

export const getRutasActivas = async (req, res) => {
  try {
    const { repartidorId, dia, hora } = req.params;

    const rutas = await db.Ruta_frecuente.findAll({
      where: {
        id_usuario: repartidorId,
        dia,
        horario: {
          [Op.lte]: hora, // rutas cuyo horario sea <= a la hora actual
        },
      },
      order: [["horario", "DESC"]],
      limit: 1,
    });

    res.json(rutas);
  } catch (error) {
    console.error("❌ Error obteniendo rutas activas:", error);
    res.status(500).json({ error: "Error al obtener rutas activas" });
  }
};
