import express from "express";
import { 
  getRepartidores,
  bloquearRepartidor,
  desbloquearRepartidor,
  getValoracionesRepartidor
  , getRepartidoresCercanos
} from "../../controllers/vendedor/repartidorController.js";

const router = express.Router();

// GET /repartidores/:id → Info repartidor con valoración promedio
router.get("/:id", getRepartidores);
router.get('/valoraciones/:idRepartidor/vendedor/:idVendedor', getValoracionesRepartidor);

router.post("/bloquear/:id", bloquearRepartidor);

router.post('/desbloquear/:id', desbloquearRepartidor); 

// GET /repartidores/cercanos/:idVendedor and /repartidores/cercanos/:idVendedor/:umbral
router.get('/cercanos/:idVendedor', getRepartidoresCercanos);
router.get('/cercanos/:idVendedor/:umbral', getRepartidoresCercanos);

export default router;
