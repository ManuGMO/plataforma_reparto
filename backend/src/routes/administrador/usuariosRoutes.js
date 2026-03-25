// routes/admin/usuariosRoutes.js
import { Router } from "express";
import {
  obtenerTodosLosUsuarios,
  bloquearUsuario,
  desbloquearUsuario,
  obtenerValoracionesUsuario
} from "../../controllers/administrador/usuariosController.js";

const router = Router();

// Obtener todos los usuarios con sus roles
router.get("/", obtenerTodosLosUsuarios);

// Obtener valoraciones
router.get("/:id_usuario/valoraciones", obtenerValoracionesUsuario);

// Bloquear usuario
router.put("/:id_usuario/bloquear", bloquearUsuario);

// Desbloquear usuario
router.put("/:id_usuario/desbloquear", desbloquearUsuario);

export default router;