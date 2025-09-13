import { Router } from "express";
import { getPedidos } from "../../controllers/vendedor/pedidoController.js";
import { estadoPedido } from "../../controllers/vendedor/pedidoController.js";


const router = Router();

router.get("/vendedor/:id", getPedidos);
router.patch("/:id/estado", estadoPedido);

export default router;
