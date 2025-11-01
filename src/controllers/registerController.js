import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

export const register = async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios WHERE correo = ?",
      [correo]
    );

    if (rows.length > 0)
      return res.status(400).json({ message: "El correo ya está registrado." });

    // Encriptar contraseña
    const hash = await bcrypt.hash(contrasena, 10);

    // Insertar usuario
    await pool.query(
      `INSERT INTO Usuarios (nombre, correo, contrasena, estado) 
       VALUES (?, ?, ?, ?)`,
      [nombre, correo, hash, "activo"]
    );

    res.json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error al registrar usuario." });
  }
};