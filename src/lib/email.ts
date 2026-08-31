import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const smtpHost = process.env.SMTP_HOST || 'smtp.serviciodecorreo.es';
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = process.env.SMTP_SECURE !== 'false';
const smtpUser = process.env.SMTP_USER || 'no-reply@laesquina51.es';
const smtpPass = process.env.SMTP_PASS || 'Telco191517k$';
const smtpFrom = process.env.SMTP_FROM || '"La Esquina 51" <no-reply@laesquina51.es>';

export const mailTransporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendWelcomeEmail({
  email,
  fullName,
}: {
  email: string;
  fullName?: string;
}) {
  const name = fullName ? fullName.trim() : 'Amigo/a';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://laesquina51.es';
  
  // Look for logo file to attach as inline CID
  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-esquina51.jpg');
  const hasLogo = fs.existsSync(logoPath);

  const attachments = hasLogo
    ? [
        {
          filename: 'logo-esquina51.jpg',
          path: logoPath,
          cid: 'logo51',
        },
      ]
    : [];

  const logoSrc = hasLogo ? 'cid:logo51' : `${appUrl}/images/logo-esquina51.jpg`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a La Esquina 51</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3E8CC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #3A2418;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3E8CC; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #FFF7E5; border-radius: 16px; border: 1px solid #E8D5A8; overflow: hidden; box-shadow: 0 4px 12px rgba(58, 36, 24, 0.08); margin: 0 auto;">
          <!-- HEADER WITH LOGO -->
          <tr>
            <td align="center" style="background-color: #3A2418; padding: 30px 20px 25px 20px;">
              <img src="${logoSrc}" alt="La Esquina 51" width="160" height="160" style="width: 160px; height: 160px; object-fit: contain; display: block; border-radius: 50%; border: 3px solid #B88727;" />
              <h1 style="color: #F3E8CC; font-size: 26px; margin: 15px 0 0 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">
                LA ESQUINA 51
              </h1>
              <p style="color: #B88727; font-size: 12px; margin: 5px 0 0 0; letter-spacing: 3px; text-transform: uppercase; font-weight: 600;">
                STREET FOOD CON ALMA
              </p>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 35px 30px 25px 30px;">
              <h2 style="color: #A94F2F; font-size: 22px; margin: 0 0 15px 0; font-weight: 700;">
                ¡Hola, ${name}! 👋
              </h2>
              <p style="font-size: 15px; line-height: 1.6; color: #3A2418; margin: 0 0 15px 0;">
                ¡Te damos la bienvenida a la familia de <strong>La Esquina 51</strong>! 🍔❤️
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #65513F; margin: 0 0 25px 0;">
                Tu cuenta ha sido creada exitosamente. Ya puedes acceder a nuestra carta, disfrutar de nuestras hamburguesas virales, perros calientes, boxes, shawarmas y empanadas artesanales con el auténtico sabor venezolano, y hacer tus pedidos para entrega a domicilio o recoger.
              </p>

              <!-- PROMO BOX -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3E8CC; border: 1px dashed #B88727; border-radius: 12px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 16px 20px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #A94F2F; font-weight: 800; letter-spacing: 1px;">
                      🛵 Sabor de calle directo a tu casa
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #3A2418; font-weight: 600;">
                      Reparto a domicilio rápido y seguimiento en tiempo real.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/menu" target="_blank" style="background-color: #B88727; color: #FFF7E5; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(184, 135, 39, 0.25);">
                      VER MENÚ Y HACER PEDIDO →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.5; color: #65513F; margin: 0;">
                Si tienes alguna duda o petición especial, puedes escribirnos directamente a nuestro WhatsApp oficial: <strong>+34 633 18 43 54</strong>.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #F3E8CC; border-top: 1px solid #E8D5A8; padding: 20px 30px; text-align: center;">
              <p style="font-size: 12px; color: #65513F; margin: 0 0 6px 0;">
                <strong>La Esquina 51</strong> · Street Food Venezolana en Sevilla
              </p>
              <p style="font-size: 11px; color: #8C7662; margin: 0;">
                <a href="${appUrl}" style="color: #A94F2F; text-decoration: none; font-weight: 600;">laesquina51.es</a> · Viernes, Sábados y Domingos
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return await mailTransporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: '¡Bienvenido a La Esquina 51! 🍔 Sabor de calle con alma',
    html,
    attachments,
  });
}
