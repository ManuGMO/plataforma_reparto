import { Router } from 'express';
import { getFinanzasVendedor} from '../../controllers/vendedor/finanzasController.js';

const router = Router();

// Obtener historial financiero del vendedor
router.get('/:id', getFinanzasVendedor);

export default router;