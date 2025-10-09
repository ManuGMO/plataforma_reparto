import { Router } from "express";
import { 
  getPedidos, 
  getPedidoDetalle,  // NUEVO
  estadoPedido 
} from "../../controllers/vendedor/pedidoController.js";

const router = Router();

router.get("/vendedor/:id", getPedidos);
router.get("/detalle/:pedidoId", getPedidoDetalle); // NUEVA RUTA
router.patch("/:id/estado", estadoPedido);

export default router;
