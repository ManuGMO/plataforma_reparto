import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './src/config/db.js';
import db from './src/models/indexModels.js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Configuración inicial
dotenv.config();
const app = express();
app.set('trust proxy', true);
const PORT = process.env.BACK_PORT;
const HOST = process.env.HOST;

// Sincronizar la base de datos
await starServer();
await db.sequelize.sync();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  optionsSuccessStatus: 200
};


// Middlewares
app.use(cors(corsOptions));
app.use(express.json());

// Ruta básica
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando 🚀' });
});

// Inicialización del servidor
async function starServer(retries = 5, delay = 3000) {
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conectado a MySQL');

      app.listen(PORT, HOST, () => {
        console.log(`🚀Servidor corriendo en http://${HOST}:${PORT}`);
      });
      return;

    } catch (error) {
      console.log('❌Error al conectar a la base de datos:');
      retries--;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('No se pudo conectar a la DB');
};

import productosRoutes from "./src/routes/vendedor/productosRoutes.js";
import pedidosRoutes from "./src/routes/vendedor/pedidosRoutes.js";
import ValorarRepartidores from "./src/routes/vendedor/repartidorRoutes.js";
import verFinanzas from "./src/routes/vendedor/finanzasRoutes.js";

import pedidoRoutes from "./src/routes/comprador/pedidosRoutes.js";
import productoRoutes from "./src/routes/comprador/productoRoutes.js";
import carritoRoutes from "./src/routes/comprador/carritoRoutes.js";

import notificacionesRoutes from "./src/routes/notificacionesRoutes.js";
import usuarioRoutes from "./src/routes/usuarioRoutes.js";

import repartidorRoutes from './src/routes/repartidor/repartidorRoutes.js';
import rutaRoutes from './src/routes/repartidor/rutaRoutes.js';

import comprobanteRoutes from "./src/routes/administrador/comprobanteRoutes.js";
import pagosVendedorRoutes from "./src/routes/administrador/pagosVendedorRoutes.js";
import pagosRepartidorRoutes from "./src/routes/administrador/pagosRepartidorRoutes.js";
import usuariosRoutes from "./src/routes/administrador/usuariosRoutes.js";
import dashboardRoutes from "./src/routes/administrador/dashboardRoutes.js";
import gananciasRoutes from "./src/routes/administrador/gananciasRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import { authenticate } from './src/middlewares/authMiddleware.js';
import { requireRole } from './src/middlewares/roleMiddleware.js';
import { forceOwner } from './src/middlewares/forceOwner.js';



app.use("/api/usuarios", usuarioRoutes);

// Autenticación
app.use('/api/auth', authRoutes);


app.use('/api/admin', authenticate, requireRole('admin'));

// Comprador (registrar rutas específicas antes de rutas genéricas)
app.use("/api/pedidos/comprador", authenticate, forceOwner(), requireRole('comprador'), pedidoRoutes);
app.use("/api/productos/comprador", authenticate, forceOwner(), requireRole('comprador'), productoRoutes);
app.use("/api/carrito/comprador", authenticate, forceOwner(), requireRole('comprador'), carritoRoutes);

// vendedor
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/productos", authenticate, forceOwner(), requireRole('vendedor'), productosRoutes);
app.use("/api/pedidos", authenticate, forceOwner(), requireRole('vendedor'), pedidosRoutes);
app.use("/api/repartidores", authenticate, forceOwner(), requireRole('vendedor'), ValorarRepartidores);
app.use("/api/finanzas", authenticate, forceOwner(), requireRole('vendedor'), verFinanzas);

// Repartidor
app.use("/api/repartidor", authenticate, forceOwner(), requireRole('repartidor'), repartidorRoutes);
app.use("/api/rutas", authenticate, forceOwner(), requireRole('repartidor'), rutaRoutes);

//administrador
app.use("/api/admin/comprobantes", authenticate, requireRole('admin'), comprobanteRoutes);
app.use("/api/admin/pagos-vendedores", authenticate, requireRole('admin'), pagosVendedorRoutes);
app.use("/api/admin/pagos-repartidores", authenticate, requireRole('admin'), pagosRepartidorRoutes);
app.use("/api/admin/usuarios", authenticate, requireRole('admin'), usuariosRoutes);
app.use("/api/admin/dashboard", authenticate, requireRole('admin'), dashboardRoutes);
app.use("/api/admin/ganancias-semanales", authenticate, requireRole('admin'), gananciasRoutes);


// Notificacion
app.use("/api/notificaciones", notificacionesRoutes);



//startServer();