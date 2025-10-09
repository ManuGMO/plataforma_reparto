import { Router } from "express";
import {
  obtenerEstadisticasDashboard,
  obtenerActividadReciente
} from "../../controllers/administrador/dashboardController.js";

const router = Router();

// Estadísticas generales
router.get("/estadisticas", obtenerEstadisticasDashboard);

// Actividad reciente
router.get("/actividad-reciente", obtenerActividadReciente);

export default router;