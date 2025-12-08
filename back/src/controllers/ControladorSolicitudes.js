const { CrearSolicitud,CancelarSolicitud } = require("../models/ModeloSolicitudes");

const tipos = ['computadora', 'restirador', 'libro'];
async function crearSolicitud(req,res) {
    const { tipo ,boleta,idRecurso } = req.body;
    const regularExpression = /^[0-9 ]{10}$/;
    const regularExpressiontipo = /^[a-zA-Z]+$/;

    
    if (!tipo || !boleta || !idRecurso) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }
    if (!regularExpression.test(boleta)) {
        return res.status(400).json({ success: false, message: 'La boleta debe ser un número válido de longitud 10' });
    }else if (!regularExpressiontipo.test(tipo).toLowerCase()) {
        return res.status(400).json({ success: false, message: 'El tipo de solicitud debe contener solo letras' });
    }else if (!Number.isInteger(idRecurso) || idRecurso <= 0) {
        return res.status(400).json({ success: false, message: 'El ID del recurso debe ser un número entero positivo' });
    }
    if (!tipos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitud inválido' });
    }
    await CrearSolicitud(tipo, boleta, idRecurso)
        .then((resultado) => {
            if (resultado.success) {
                return res.status(201).json({ success: true, message: 'Solicitud creada exitosamente' });
            } else {
                return res.status(500).json({ success: false, message: resultado.message || 'Error al crear la solicitud' });
            }
        })
        .catch((error) => {
            console.error('Error al crear la solicitud:', error);
            return res.status(500).json({ success: false, message: 'Error interno del servidor' });
        });

}
async function cancelarSolicitud(req,res) {
    const { tipo, ID } = req.body;
    if (!ID || !Number.isInteger(ID) || ID <= 0) {
        return res.status(400).json({ success: false, message: 'El ID de la solicitud debe ser un número entero positivo' });
    }
    const tipos = ['computadora', 'restirador', 'libro'];
    if (!tipo || !tipos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitud inválido' });
    }


    const resultado = await CancelarSolicitud(tipo, ID);
    if (resultado.success) {
        return res.status(200).json({ success: true, message: 'Solicitud cancelada exitosamente' });
    } else {
        return res.status(500).json({ success: false, message: resultado.message || 'Error al cancelar la solicitud' });
    }
}

// Función auxiliar encargada de construir la plantilla y enviar el correo
async function enviarCorreo({ destinatario, nombre, tipoSolicitud, boleta, idRecurso, grupo, ubicacion }) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return { success: false, error: 'EMAIL_USER o EMAIL_PASS sin configurar' };
    }

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const fechaSolicitud = new Date();
    const fechaLimite = new Date(fechaSolicitud.getTime() + 90 * 60 * 1000);
    const html = construirPlantilla({ nombre, tipoSolicitud, boleta, idRecurso, grupo, ubicacion, fechaSolicitud, fechaLimite });
    const textoPlano = construirTextoPlano({ nombre, tipoSolicitud, boleta, idRecurso, grupo, ubicacion, fechaSolicitud, fechaLimite });

    try {
        await transporter.sendMail({
            from: `C-Book <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject,
            html,
            text: textoPlano
        });
        return { success: true };
    } catch (error) {
        console.error('Error enviando correo:', error);
        return { success: false, error: 'No fue posible enviar el correo' };
    }
}

// Plantilla HTML con la información del lugar donde debe presentarse
function construirPlantilla({ nombre, tipoSolicitud, boleta, idRecurso, grupo, ubicacion, fechaSolicitud, fechaLimite }) {
    const formato = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeStyle: 'short' });
    const fechaSolicitudStr = formato.format(fechaSolicitud);
    const fechaLimiteStr = formato.format(fechaLimite);

    return `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8" />
            <title>Confirmación de solicitud</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
                .wrapper { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
                .card { background: #fff; border-radius: 16px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12); overflow: hidden; }
                .header { background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #fff; padding: 32px; }
                .header h1 { margin: 0; font-size: 24px; }
                .content { padding: 24px 32px 32px; color: #0f172a; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 24px; }
                .grid-item { background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; }
                .grid-item span { display: block; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
                .grid-item strong { display: block; margin-top: 6px; font-size: 16px; color: #0f172a; }
                .footer { padding: 0 32px 32px; color: #94a3b8; font-size: 13px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="card">
                    <div class="header">
                        <p style="margin:0 0 6px;opacity:.85;">Confirmación de solicitud</p>
                        <h1>Hola ${nombre},</h1>
                        <p style="margin:0;opacity:.85;">Tu solicitud de ${tipoSolicitud} fue registrada exitosamente.</p>
                    </div>
                    <div class="content">
                        <p>Presenta este resumen en ${ubicacion} antes de la hora límite para mantener el recurso reservado.</p>
                        <div class="grid">
                            <div class="grid-item"><span>Boleta</span><strong>${boleta}</strong></div>
                            <div class="grid-item"><span>Grupo</span><strong>${grupo}</strong></div>
                            <div class="grid-item"><span>ID del recurso</span><strong>${idRecurso}</strong></div>
                            <div class="grid-item"><span>Ubicación</span><strong>${ubicacion}</strong></div>
                            <div class="grid-item"><span>Fecha de solicitud</span><strong>${fechaSolicitudStr}</strong></div>
                            <div class="grid-item"><span>Fecha límite</span><strong>${fechaLimiteStr}</strong></div>
                        </div>
                        <p style="margin-top:24px;color:#0f172a;line-height:1.6;">Si no te presentas antes de la fecha límite, la solicitud se liberará automáticamente para otros usuarios.</p>
                    </div>
                    <div class="footer">
                        <p>C-Book · Biblioteca Digital — correo automático, no respondas a este buzón.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
}

// Texto plano para clientes que no renderizan HTML
function construirTextoPlano({ nombre, tipoSolicitud, boleta, idRecurso, grupo, ubicacion, fechaSolicitud, fechaLimite }) {
    const formato = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeStyle: 'short' });

    return `Hola ${nombre},\n\n` +
        `Tu solicitud de ${tipoSolicitud} fue registrada correctamente.\n\n` +
        `Boleta: ${boleta}\n` +
        `Grupo: ${grupo}\n` +
        `ID del recurso: ${idRecurso}\n` +
        `Ubicación: ${ubicacion}\n` +
        `Fecha de solicitud: ${formato.format(fechaSolicitud)}\n` +
        `Fecha límite de llegada: ${formato.format(fechaLimite)}\n\n` +
        'Debes presentarte antes de la hora límite o la solicitud se liberará automáticamente.\n\n' +
        'C-Book | Biblioteca Digital';
}

module.exports = { crearSolicitud, cancelarSolicitud };
