import { Router } from "express";
import {
  crearPedido,
  crearPedidoDesdeCarrito,
  obtenerPedidosDelComprador,
  actualizarEstadoPedido
} from "../../controllers/comprador/pedidoController.js";

const router = Router();

// Crear pedido desde carrito
router.post("/desde-carrito", crearPedidoDesdeCarrito);

// Crear pedido personalizado
router.post("/", crearPedido);

// Listar pedidos por comprador
router.get("/:id_usuario", obtenerPedidosDelComprador);

// Actualizar estado
router.put("/:id_pedido/estado", actualizarEstadoPedido);

export default router;