const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'escbookgmai@gmail.com',
        pass: 'xhrm sxxt xbxs vnqa'
    }
});

async function enviarCorreo(destinatario, asunto, html) {
    const mailOptions = {
        from: 'C-Book System <escbookgmai@gmail.com>',
        to: destinatario,
        subject: asunto,
        html: html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: ' + info.response);
        return { success: true };
    } catch (error) {
        console.error('Error enviando correo:', error);
        return { success: false, error };
    }
}

module.exports = { enviarCorreo };
