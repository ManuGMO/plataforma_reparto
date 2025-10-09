import { Router } from "express";
import {
  crearPedidoDesdeCarrito,
  obtenerPedidosDelComprador,
  actualizarEstadoPedido, calificarPedido
} from "../../controllers/comprador/pedidoController.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';



const router = Router();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/comprobantes/"); // carpeta local
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Crear pedido desde carrito
router.post("/desde-carrito", upload.single('comprobante'), crearPedidoDesdeCarrito);

router.post("/calificar", calificarPedido);

// Listar pedidos por comprador
router.get("/:id_usuario", obtenerPedidosDelComprador);

// Actualizar estado
router.put("/:id_pedido/estado", actualizarEstadoPedido);

export default router;