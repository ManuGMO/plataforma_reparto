import express from "express";
import { 
  getRepartidores,
  bloquearRepartidor,
  desbloquearRepartidor,
  getValoracionesRepartidor
} from "../../controllers/vendedor/repartidorController.js";

const router = express.Router();

// GET /repartidores/:id → Info repartidor con valoración promedio
router.get("/:id", getRepartidores);
router.get('/valoraciones/:idRepartidor/vendedor/:idVendedor', getValoracionesRepartidor);

router.post("/bloquear/:id", bloquearRepartidor);

router.post('/desbloquear/:id', desbloquearRepartidor); 

export default router;
