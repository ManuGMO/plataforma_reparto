import { Router } from "express";
import express from "express";
import { getProductos, createProduct, createCategoria, getCategorias, eliminarProducto, actualizarProducto, validarNombreProducto} from "../../controllers/vendedor/productoController.js";
import multer from "multer";
import path from "path";

const router = Router();

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products/"); // carpeta local
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|heic|heif/;
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('image/');
  if (extOk || mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

router.get("/obtener/:id", getProductos);
router.post("/publicar/:id", upload.single("imagen"), createProduct);
router.put("/actualizar/:id", upload.single("imagen"), actualizarProducto);

router.post("/validar-nombre/:id", validarNombreProducto);

router.post('/crear_categoria', createCategoria);
router.get('/recuperar_categoria', getCategorias);

router.delete("/eliminar/:id", eliminarProducto);



// Servir imágenes estáticas
router.use("/uploads/products", express.static("uploads/products"));

export default router;