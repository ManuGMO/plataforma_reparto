// src/routes/productoRoutes.js
import express from "express";
import { 
  getProductos, 
  getProductosPorCategoria 
} from "../../controllers/comprador/productoController.js";

const router = express.Router();

// GET /api/productos → lista todos los productos
router.get("/", getProductos);

// GET /api/productos/categoria/:nombre → productos por categoría
router.get("/categoria/:nombre", getProductosPorCategoria);

export default router;