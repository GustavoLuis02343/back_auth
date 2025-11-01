import pool from '../config/db.js';
import { generateCode, sendVerificationCode } from '../services/emailService.js';

// Configurar 2FA por EMAIL
export const setupEmail2FA = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ message: 'El correo es obligatorio' });
    }

    // Verificar que el usuario existe
    const [rows] = await pool.query(
      'SELECT * FROM Usuarios WHERE correo = ?',
      [correo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar código de 6 dígitos
    const code = generateCode();
    console.log(`📧 Código generado para ${correo}: ${code}`); // Para debugging

    // Guardar código temporalmente en BD (sin activar 2FA aún)
    await pool.query(
      `UPDATE Usuarios 
       SET secreto_2fa = ?, 
           metodo_2fa = 'EMAIL',
           esta_2fa_habilitado = 0
       WHERE correo = ?`,
      [code, correo]
    );

    // Enviar código por email
    const resultado = await sendVerificationCode(correo, code);

    if (resultado.success) {
      res.json({
        message: '✅ Código enviado a tu correo electrónico',
        expiracion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      });
    } else {
      res.status(500).json({ 
        message: '❌ Error al enviar el código',
        error: resultado.error 
      });
    }

  } catch (error) {
    console.error('Error en setupEmail2FA:', error);
    res.status(500).json({ message: 'Error al configurar 2FA por email' });
  }
};

// Verificar código EMAIL y activar 2FA
export const verifyEmail2FA = async (req, res) => {
  try {
    const { correo, codigo } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({ message: 'Correo y código son obligatorios' });
    }

    const [rows] = await pool.query(
      'SELECT secreto_2fa, metodo_2fa FROM Usuarios WHERE correo = ?',
      [correo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const codigoGuardado = rows[0].secreto_2fa;

    // Verificar si el código coincide
    if (codigo === codigoGuardado) {
      // Activar 2FA por EMAIL
      await pool.query(
        `UPDATE Usuarios 
         SET esta_2fa_habilitado = 1 
         WHERE correo = ?`,
        [correo]
      );

      res.json({ message: '✅ 2FA por email activado correctamente' });
    } else {
      res.status(401).json({ message: '❌ Código incorrecto' });
    }

  } catch (error) {
    console.error('Error en verifyEmail2FA:', error);
    res.status(500).json({ message: 'Error al verificar código' });
  }
};

// Enviar código EMAIL durante login
export const sendEmailCode = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ message: 'El correo es obligatorio' });
    }

    // Generar nuevo código
    const code = generateCode();
    console.log(`📧 Código de login para ${correo}: ${code}`);

    // Actualizar código en BD
    await pool.query(
      'UPDATE Usuarios SET secreto_2fa = ? WHERE correo = ?',
      [code, correo]
    );

    // Enviar código por email
    const resultado = await sendVerificationCode(correo, code);

    if (resultado.success) {
      res.json({ message: '✅ Código enviado a tu correo' });
    } else {
      res.status(500).json({ message: '❌ Error al enviar el código' });
    }

  } catch (error) {
    console.error('Error en sendEmailCode:', error);
    res.status(500).json({ message: 'Error al enviar código' });
  }
};

// Validar código EMAIL durante login
export const validateEmailCode = async (req, res) => {
  try {
    const { correo, codigo } = req.body;

    if (!correo || !codigo) {
      return res.status(400).json({ message: 'Correo y código son obligatorios' });
    }

    const [rows] = await pool.query(
      'SELECT secreto_2fa FROM Usuarios WHERE correo = ?',
      [correo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const codigoGuardado = rows[0].secreto_2fa;

    if (codigo === codigoGuardado) {
      res.json({ valid: true, message: '✅ Código válido' });
    } else {
      res.status(401).json({ valid: false, message: '❌ Código incorrecto' });
    }

  } catch (error) {
    console.error('Error en validateEmailCode:', error);
    res.status(500).json({ message: 'Error al validar código' });
  }
};