import express from "express";
import { actualizarUbicacion, obtenerUsuarioPorId } from "../controllers/usuarioController.js";

const router = express.Router();

router.put("/:id_usuario/ubicacion", actualizarUbicacion);
router.get("/:id_usuario", obtenerUsuarioPorId);

export default router;