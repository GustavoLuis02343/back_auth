import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbSettings = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbSettings);

// Verificar conexión
pool.getConnection()
  .then(connection => {
    console.log(`✅ Conectado a MySQL (${process.env.DB_NAME})`);
    connection.release();
  })
  .catch(err => console.error("❌ Error de conexión:", err));

export default pool;