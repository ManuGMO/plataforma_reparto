import express from "express";
import { actualizarUbicacion } from "../controllers/usuarioController.js";

const router = express.Router();

router.put("/:id_usuario/ubicacion", actualizarUbicacion);

export default router;