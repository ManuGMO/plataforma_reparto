import { Router } from "express";
import {
  obtenerEstadisticasDashboard,
  obtenerActividadReciente
  , obtenerResumenDiario
} from "../../controllers/administrador/dashboardController.js";

const router = Router();

// Estadísticas generales
router.get("/estadisticas", obtenerEstadisticasDashboard);

// Resumen diario (actualizado a las 00:00)
router.get('/diario', obtenerResumenDiario);

// Actividad reciente
router.get("/actividad-reciente", obtenerActividadReciente);

export default router;