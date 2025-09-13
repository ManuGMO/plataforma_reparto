import express from "express";
import { 
  obtenerCarrito,
  agregarAlCarrito,
  eliminarDelCarrito,
  actualizarCantidadCarrito,
  vaciarCarrito
} from "../../controllers/comprador/carritoController.js";

const router = express.Router();

// GET /api/carrito/:id_usuario → obtener carrito del usuario
router.get("/:id_usuario", obtenerCarrito);

// POST /api/carrito/:id_usuario/agregar → agregar producto al carrito
router.post("/:id_usuario/agregar", agregarAlCarrito);

// DELETE /api/carrito/:id_usuario/producto/:id_producto → eliminar producto del carrito
router.delete("/:id_usuario/producto/:id_producto", eliminarDelCarrito);

// PUT /api/carrito/:id_usuario/producto/:id_producto → actualizar cantidad
router.put("/:id_usuario/producto/:id_producto", actualizarCantidadCarrito);

// DELETE /api/carrito/:id_usuario → vaciar carrito
router.delete("/:id_usuario", vaciarCarrito);

export default router;