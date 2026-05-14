const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'cbookgmai@gmail.com',
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

/**
 * Genera un correo HTML con diseño profesional para C-Book.
 * @param {object} opts
 * @param {string} opts.titulo - Título principal del correo
 * @param {string} opts.mensaje - Mensaje descriptivo
 * @param {string} opts.nombre - Nombre del alumno
 * @param {string} opts.boleta - Boleta del alumno
 * @param {string} opts.grupo - Grupo del alumno
 * @param {Array<{label:string, value:string}>} opts.detalles - Filas de detalle del recurso
 * @param {string} [opts.color='#6366f1'] - Color de acento
 * @param {string} [opts.estado] - Estado de la solicitud
 * @param {string} [opts.estadoColor] - Color del badge de estado
 */
function plantillaCorreo({ titulo, mensaje, nombre, boleta, grupo, detalles = [], color = '#6366f1', estado, estadoColor }) {
    const filas = detalles.map(d =>
        `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;width:140px">${d.label}</td><td style="padding:8px 12px;font-weight:600;font-size:13px;border-bottom:1px solid #f3f4f6">${d.value}</td></tr>`
    ).join('');

    const badgeHtml = estado
        ? `<span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${estadoColor || '#f59e0b'}">${estado}</span>`
        : '';

    return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <!-- Header -->
  <div style="background:${color};padding:28px 32px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-.3px">📚 C-Book</h1>
  </div>

  <!-- Body -->
  <div style="padding:28px 32px">
    <h2 style="margin:0 0 6px;font-size:18px;color:#111827">${titulo}</h2>
    ${badgeHtml ? `<div style="margin-bottom:16px">${badgeHtml}</div>` : ''}
    <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.6">${mensaje}</p>

    <!-- Datos del alumno -->
    <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:18px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:8px;font-weight:600">Datos del alumno</div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:80px">Nombre</td><td style="padding:4px 0;font-weight:600;font-size:13px">${nombre || '-'}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Boleta</td><td style="padding:4px 0;font-weight:600;font-size:13px">${boleta || '-'}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Grupo</td><td style="padding:4px 0;font-weight:600;font-size:13px">${grupo || '-'}</td></tr>
      </table>
    </div>

    <!-- Detalles del recurso -->
    ${filas ? `
    <div style="background:#f9fafb;border-radius:8px;overflow:hidden;margin-bottom:18px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;padding:14px 12px 6px;font-weight:600">Detalles del recurso</div>
      <table style="width:100%;border-collapse:collapse">${filas}</table>
    </div>` : ''}
  </div>

  <!-- Footer -->
  <div style="padding:16px 32px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0;font-size:11px;color:#9ca3af">Este correo fue generado automáticamente por el sistema C-Book.<br>No respondas a este mensaje.</p>
  </div>
</div>
</body></html>`;
}

module.exports = { enviarCorreo, plantillaCorreo };
