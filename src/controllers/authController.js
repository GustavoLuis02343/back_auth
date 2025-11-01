import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { generateCode, sendVerificationCode } from "../services/emailService.js";

dotenv.config();

export const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena)
      return res.status(400).json({ message: "Correo y contraseña son obligatorios." });

    // Consulta MySQL
    const [rows] = await pool.query(
      "SELECT * FROM Usuarios WHERE correo = ?",
      [correo]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado." });

    const user = rows[0];

    // Verificar contraseña
    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match)
      return res.status(401).json({ message: "Contraseña incorrecta." });

    // Verificar estado
    if (user.estado !== "activo")
      return res.status(403).json({ message: "Cuenta inactiva o suspendida." });

    // ⭐ Verificar si tiene 2FA habilitado
    if (user.esta_2fa_habilitado) {
      // 🔥 SI ES EMAIL, ENVIAR CÓDIGO AUTOMÁTICAMENTE
      if (user.metodo_2fa === 'EMAIL') {
        const code = generateCode();
        console.log(`📧 Código de login para ${correo}: ${code}`);

        // Guardar código en BD
        await pool.query(
          'UPDATE Usuarios SET secreto_2fa = ? WHERE correo = ?',
          [code, correo]
        );

        // Enviar código por email
        await sendVerificationCode(correo, code);
      }

      return res.json({
        message: "Credenciales correctas",
        requires2FA: true,
        metodo_2fa: user.metodo_2fa || 'TOTP',
        correo: user.correo
      });
    }

    // Si no tiene 2FA, generar token directamente
    const token = jwt.sign(
      { id_usuario: user.id_usuario, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Inicio de sesión exitoso ✅",
      token,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        estado: user.estado
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// ⭐ Login con código 2FA (CORREGIDO)
export const loginWith2FA = async (req, res) => {
  try {
    const { correo, codigo, codigo2fa } = req.body; // ✅ ACEPTAR AMBOS
    const codigoFinal = codigo || codigo2fa; // ✅ USAR EL QUE VENGA

    console.log('🔐 loginWith2FA recibido:');
    console.log('📧 Correo:', correo);
    console.log('🔢 Código:', codigoFinal);

    if (!correo || !codigoFinal) {
      return res.status(400).json({ message: "Correo y código son obligatorios" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM Usuarios WHERE correo = ?",
      [correo]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado." });

    const user = rows[0];

    console.log('🔍 Método 2FA del usuario:', user.metodo_2fa);

    // 🔥 VALIDAR EL CÓDIGO SEGÚN EL MÉTODO
    let codigoValido = false;

    if (user.metodo_2fa === 'EMAIL') {
      console.log('📧 Validando EMAIL');
      console.log('📧 Código recibido:', codigoFinal);
      console.log('📧 Código guardado:', user.secreto_2fa);
      
      // Validar código de email
      codigoValido = (codigoFinal === user.secreto_2fa);
      
    } else if (user.metodo_2fa === 'TOTP') {
      console.log('🔢 Validando TOTP');
      
      // Validar código TOTP con speakeasy
      const speakeasy = await import('speakeasy');
      codigoValido = speakeasy.default.totp.verify({
        secret: user.secreto_2fa,
        encoding: 'base32',
        token: codigoFinal,
        window: 2
      });
    }

    console.log('✅ Código válido:', codigoValido);

    if (!codigoValido) {
      return res.status(401).json({ message: "Código incorrecto" });
    }

    // 🔥 Si el código es válido, generar token
    const token = jwt.sign(
      { id_usuario: user.id_usuario, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log('✅ Login 2FA exitoso para:', correo);

    res.json({
      message: "Inicio de sesión exitoso ✅",
      token,
      usuario: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        estado: user.estado
      }
    });
  } catch (error) {
    console.error("❌ Error en loginWith2FA:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};