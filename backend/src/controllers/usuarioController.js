// src/controllers/usuarioController.js
import db from "../models/indexModels.js";

export const actualizarUbicacion = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { latitud, longitud } = req.body;

    if (!latitud || !longitud) {
      return res.status(400).json({ error: "Latitud y longitud son requeridas" });
    }

    const usuario = await db.Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    usuario.latitud = latitud;
    usuario.longitud = longitud;
    await usuario.save();

    res.json({ message: "Ubicación actualizada", usuario });
  } catch (error) {
    console.error("❌ Error al actualizar ubicación:", error);
    res.status(500).json({ error: "Error al actualizar ubicación" });
  }
};
