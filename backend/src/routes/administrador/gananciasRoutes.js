import { Router } from 'express';
import { obtenerGananciasSemanales, obtenerDetalleSemana } from '../../controllers/administrador/gananciasController.js';

const router = Router();

// Resumen semanal de ganancias (agregados por semana)
router.get('/', obtenerGananciasSemanales);

// Detalle de pedidos para una semana
router.get('/:weekStart/detalle', obtenerDetalleSemana);

export default router;
