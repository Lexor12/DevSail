// Envio de correos transaccionales con Nodemailer y Gmail SMTP
const nodemailer = require('nodemailer');
const { env } = require('../../config/env');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.mail.user,
        pass: env.mail.pass
    }
});

async function sendMail(to, subject, html) {
    await transporter.sendMail({
        from: `"DevSail" <${env.mail.user}>`,
        to,
        subject,
        html
    });
}

// Codigo de 6 digitos para verificar cuenta o recuperar contraseña
async function sendVerificationCodeEmail(to, fullName, code, purpose) {
    const isReset = purpose === 'password_reset';
    const subject = isReset
        ? 'DevSail — Código para recuperar tu contraseña'
        : 'DevSail — Verifica tu correo electrónico';
    const title = isReset ? 'Recuperación de contraseña' : 'Verifica tu cuenta en DevSail';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; color: #1e293b;">
            <h2>${title}</h2>
            <p>Hola <strong>${fullName}</strong>,</p>
            <p>Usa el siguiente código de 6 dígitos (vence en 15 minutos):</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px; background: #f1f5f9; text-align: center; border-radius: 8px;">
                ${code}
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 16px;">Si no solicitaste este código, ignora este mensaje.</p>
        </div>
    `;
    await sendMail(to, subject, html);
}

// Comprobante de activacion de Plan Pro o Destacado
async function sendPaymentReceiptEmail(to, fullName, receipt) {
    const projectLine = receipt.projectNickname
        ? `<p><strong>Proyecto:</strong> ${receipt.projectNickname}</p>`
        : '';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; color: #1e293b;">
            <h2>Comprobante de pago — DevSail</h2>
            <p>Hola <strong>${fullName}</strong>, tu pago fue confirmado.</p>
            <p><strong>Concepto:</strong> ${receipt.conceptLabel}</p>
            ${projectLine}
            <p><strong>Monto:</strong> $${receipt.amount.toFixed(2)} MXN (IVA incluido)</p>
            <p><strong>Número de orden PayPal:</strong> ${receipt.paypalOrderId}</p>
            <p><strong>Inicio:</strong> ${receipt.startsAt}</p>
            <p><strong>Fin:</strong> ${receipt.endsAt}</p>
        </div>
    `;
    await sendMail(to, 'DevSail — Comprobante de contratación', html);
}

// Aviso de moderacion cuando se oculta proyecto/comentario o se retira destacado
async function sendModerationNoticeEmail(to, fullName, actionLabel, targetName, reason) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; color: #1e293b;">
            <h2>Aviso de moderación — DevSail</h2>
            <p>Hola <strong>${fullName}</strong>,</p>
            <p>Te informamos que se aplicó la siguiente acción: <strong>${actionLabel}</strong> (${targetName}).</p>
            <p><strong>Motivo:</strong> ${reason}</p>
        </div>
    `;
    await sendMail(to, 'DevSail — Aviso de moderación', html);
}

// Aviso al eliminar cuenta definitivamente
async function sendAccountDeletedEmail(to, fullName) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; color: #1e293b;">
            <h2>Cuenta eliminada — DevSail</h2>
            <p>Hola <strong>${fullName}</strong>, confirmamos que tu cuenta y tus proyectos fueron eliminados definitivamente.</p>
        </div>
    `;
    await sendMail(to, 'DevSail — Tu cuenta ha sido eliminada', html);
}
// Exportamos las funciones para que puedan ser usadas en otros archivos
module.exports = {
    sendVerificationCodeEmail,
    sendPaymentReceiptEmail,
    sendModerationNoticeEmail,
    sendAccountDeletedEmail
};