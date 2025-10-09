import { Router } from 'express';
import {
  obtenerPagosRepartidores,
  obtenerDetallePagosRepartidor,
  marcarPagosComoPagados
} from '../../controllers/administrador/pagosRepartidorController.js';

const router = Router();

// Resumen de pagos por repartidor
router.get('/', obtenerPagosRepartidores);

// Detalle de pagos de un repartidor
router.get('/:id_repartidor/detalle', obtenerDetallePagosRepartidor);

// Marcar pagos como pagados (crea una liquidación)
router.post('/:id_repartidor/marcar-pagado', marcarPagosComoPagados);

export default router;
