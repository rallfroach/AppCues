const nodemailer = require('nodemailer');

// Configurar el transporte para Office 365
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: 'SoporteTI@hausmann.es',
      pass: 'fpdxqncwjbttwjrw'
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });

// Función para enviar correos
const enviarCorreo = async (to, subject, text, html = null) => {
    try {
        const mailOptions = {
            from: 'SoporteTI@hausmann.es', // Cambia por tu correo
            to,
            subject,
            text,
            ...(html && { html }) // Si pasas HTML, lo agrega
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado:', info.response);
        return info;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw error;
    }
};

module.exports = enviarCorreo;
