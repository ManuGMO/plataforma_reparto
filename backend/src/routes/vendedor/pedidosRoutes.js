import { Router } from "express";
import { getPedidos } from "../../controllers/vendedor/pedidoController.js";
import { estadoPedido, marcarListoParaRecoger } from "../../controllers/vendedor/pedidoController.js";


const router = Router();

router.get("/vendedor/:id", getPedidos);
router.patch("/:id/estado", estadoPedido);
router.patch('/:pedidoId/listo', marcarListoParaRecoger);

export default router;
