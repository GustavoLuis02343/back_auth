import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar transportador de Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar configuración (opcional, para debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error);
  } else {
    console.log('✅ Servicio de email listo');
  }
});

// Generar código aleatorio de 6 dígitos
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enviar código por email
export const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: `"LoginApp Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Tu código de verificación - LoginApp',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #f5f5f5;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0;">🔐 Código de Verificación</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola,</p>
          <p style="color: #333; font-size: 16px;">Tu código de autenticación de dos factores es:</p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <h1 style="color: white; font-size: 42px; letter-spacing: 10px; margin: 0; font-weight: bold;">${code}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px;">⏰ Este código expirará en <strong>5 minutos</strong>.</p>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Si no solicitaste este código, ignora este mensaje y tu cuenta permanecerá segura.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            LoginApp - Sistema de Autenticación Segura<br>
            Este es un mensaje automático, por favor no respondas.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a: ${email}`);
    return { success: true, message: 'Código enviado correctamente' };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, message: 'Error al enviar el código', error: error.message };
  }
};

export default { generateCode, sendVerificationCode };