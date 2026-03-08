import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: console.log,
    }
);

async function alterTable() {
    try {
        await sequelize.authenticate();
        console.log('Connected to MySQL');

        await sequelize.query(`
      ALTER TABLE pedido_vendedor 
      MODIFY COLUMN estado_pedido ENUM('pendiente', 'aceptado', 'listo_para_recoger', 'en_reparto', 'entregado', 'rechazado', 'cancelado') 
      NOT NULL DEFAULT 'pendiente';
    `);

        console.log('Table altered successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error altering table:', err);
        process.exit(1);
    }
}

alterTable();
