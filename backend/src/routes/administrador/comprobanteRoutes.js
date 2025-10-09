import { Router } from "express";
import { obtenerComprobantes, validarComprobante } from "../../controllers/administrador/comprobanteController.js";

const router = Router();

router.get("/", obtenerComprobantes);
router.put("/:id_pedido/validar", validarComprobante);

export default router;