import { Router } from "express";
import {
  obtenerPagosVendedores,
  obtenerDetallePagosVendedor,
  marcarPedidosComoPagados
} from "../../controllers/administrador/pagosVendedorController.js";

const router = Router();

// Obtener resumen de pagos de todos los vendedores
router.get("/", obtenerPagosVendedores);

// Obtener detalle de pagos de un vendedor específico
router.get("/:id_vendedor/detalle", obtenerDetallePagosVendedor);

// Marcar pedidos pendientes como pagados
router.put("/:id_vendedor/marcar-pagado", marcarPedidosComoPagados);
// Marcar pedidos pendientes como pagados para una semana específica (recibe { weekStart } en body)
router.post("/:id_vendedor/marcar-pagado", marcarPedidosComoPagados);

export default router;