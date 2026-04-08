// Servicio de email — WeblyNow
// SMTP: mail.weblynow.com:465 (SSL)  |  Cuenta: hello@weblynow.com
import nodemailer from 'nodemailer'
import crypto from 'crypto'

// ─── Transporter ─────────────────────────────────────────────────────────────

function crearTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.weblynow.com',
    port: Number(process.env.EMAIL_PORT || 465),
    secure: true, // SSL en 465
    auth: {
      user: process.env.EMAIL_USER || 'hello@weblynow.com',
      pass: process.env.EMAIL_PASSWORD!,
    },
    tls: {
      rejectUnauthorized: false, // hosting compartido sin cert wildcard
    },
  })
}

const FROM = '"WeblyNow" <hello@weblynow.com>'
const ADMIN_EMAIL = process.env.EMAIL_ADMIN || 'hello@weblynow.com'
const APP_URL = process.env.NEXTAUTH_URL || 'https://app.weblynow.com'

// ─── Token de recuperación de contraseña (HMAC firmado, sin DB) ──────────────

export function crearTokenRecuperacion(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET!
  const exp = Date.now() + 60 * 60 * 1000 // 1 hora
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verificarTokenRecuperacion(token: string): string | null {
  try {
    const secret = process.env.NEXTAUTH_SECRET!
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx === -1) return null
    const payload = token.slice(0, dotIdx)
    const sig = token.slice(dotIdx + 1)
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
    if (sig !== expectedSig) return null
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (Date.now() > exp) return null
    return email as string
  } catch {
    return null
  }
}

// ─── Helpers HTML ─────────────────────────────────────────────────────────────

function layoutEmail(contenido: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WeblyNow</title>
</head>
<body style="margin:0;padding:0;background:#080B14;font-family:'Helvetica Neue',Arial,sans-serif;color:#E2E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080B14;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#a855f7);display:inline-block;text-align:center;line-height:40px;">
              <span style="color:white;font-size:20px;font-weight:900;">⚡</span>
            </div>
            <span style="font-size:24px;font-weight:900;background:linear-gradient(135deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px;">WeblyNow</span>
          </div>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:40px 36px;">
          ${contenido}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;color:#64748B;font-size:12px;line-height:1.6;">
          <p style="margin:0;">WeblyNow · Crea tu web con inteligencia artificial</p>
          <p style="margin:4px 0 0;">¿Dudas? Responde este email y te ayudamos.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btnPrimario(texto: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin:8px 0;">${texto}</a>`
}

// ─── Email: Bienvenida ────────────────────────────────────────────────────────

export async function enviarEmailBienvenida(nombre: string, email: string) {
  const transporter = crearTransporter()
  const html = layoutEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#F1F5F9;">¡Bienvenido a WeblyNow, ${nombre}! 🎉</h2>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;line-height:1.6;">Tu cuenta está lista. En minutos puedes tener tu sitio web profesional generado con IA.</p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0 0 24px;" />
    <p style="margin:0 0 8px;color:#CBD5E1;font-size:14px;font-weight:600;">🚀 ¿Qué puedes hacer ahora?</p>
    <ul style="margin:0 0 28px;padding-left:20px;color:#94A3B8;font-size:14px;line-height:1.8;">
      <li>Completa el wizard con los datos de tu negocio</li>
      <li>La IA genera tu web completa en menos de 2 minutos</li>
      <li>Publícala con 1 click en Vercel (gratis)</li>
      <li>Conéctale tu dominio personalizado</li>
    </ul>
    <div style="text-align:center;margin-bottom:8px;">
      ${btnPrimario('Ir a mi dashboard →', `${APP_URL}/dashboard`)}
    </div>
  `)
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `¡Bienvenido a WeblyNow, ${nombre}! 🚀`,
    html,
  })
}

// ─── Email: Recuperar contraseña ──────────────────────────────────────────────

export async function enviarEmailRecuperacion(email: string, nombre: string) {
  const token = crearTokenRecuperacion(email)
  const url = `${APP_URL}/login/recuperar/${token}`
  const transporter = crearTransporter()
  const html = layoutEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#F1F5F9;">Recuperar contraseña</h2>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;line-height:1.6;">Hola ${nombre}, recibimos una solicitud para restablecer tu contraseña de WeblyNow.</p>
    <div style="text-align:center;margin:28px 0;">
      ${btnPrimario('Restablecer contraseña →', url)}
    </div>
    <p style="margin:0 0 8px;color:#64748B;font-size:13px;">Este enlace expira en <strong style="color:#94A3B8;">1 hora</strong>.</p>
    <p style="margin:0;color:#64748B;font-size:13px;">Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.</p>
  `)
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Recuperar contraseña — WeblyNow',
    html,
  })
}

// ─── Email: Admin — nuevo sitio creado ───────────────────────────────────────

interface DatosSitioCreado {
  sitioId: string
  sitioNombre: string
  plan: string
  usuarioNombre: string
  usuarioEmail: string
  tokensUsados?: number
}

export async function enviarEmailAdminSitioCreado(datos: DatosSitioCreado) {
  const transporter = crearTransporter()
  const planEmoji: Record<string, string> = {
    basico: '⭐',
    pro: '🚀',
    premium: '👑',
    broker: '🏠',
  }
  const emoji = planEmoji[datos.plan] || '🌐'
  const adminUrl = `${APP_URL}/admin/sitios`
  const html = layoutEmail(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#F1F5F9;">${emoji} Nuevo sitio creado</h2>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:14px;">Un usuario acaba de generar su sitio web en WeblyNow.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#64748B;font-size:13px;width:140px;">Sitio</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#F1F5F9;font-size:14px;font-weight:600;">${datos.sitioNombre}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#64748B;font-size:13px;">Plan</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#818CF8;font-size:14px;font-weight:700;text-transform:uppercase;">${datos.plan}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#64748B;font-size:13px;">Usuario</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#F1F5F9;font-size:14px;">${datos.usuarioNombre}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);color:#64748B;font-size:13px;">Email</td>
        <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);"><a href="mailto:${datos.usuarioEmail}" style="color:#818CF8;font-size:14px;">${datos.usuarioEmail}</a></td>
      </tr>
      ${datos.tokensUsados ? `<tr>
        <td style="padding:12px 16px;color:#64748B;font-size:13px;">Tokens usados</td>
        <td style="padding:12px 16px;color:#94A3B8;font-size:14px;">${datos.tokensUsados.toLocaleString('es-CL')}</td>
      </tr>` : ''}
    </table>
    <div style="text-align:center;">
      ${btnPrimario('Ver en admin →', adminUrl)}
    </div>
  `)
  await transporter.sendMail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `${emoji} Nuevo sitio: ${datos.sitioNombre} (Plan ${datos.plan}) — ${datos.usuarioNombre}`,
    html,
  })
}

// ─── Email: Usuario — sitio listo ─────────────────────────────────────────────

export async function enviarEmailSitioListo(
  email: string,
  nombre: string,
  sitioNombre: string,
  sitioId: string,
) {
  const transporter = crearTransporter()
  const url = `${APP_URL}/dashboard/sitios/${sitioId}`
  const html = layoutEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#F1F5F9;">¡Tu sitio está listo! 🎉</h2>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;line-height:1.6;">Hola ${nombre}, tu sitio web <strong style="color:#F1F5F9;">${sitioNombre}</strong> fue generado con éxito por nuestra IA.</p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0 0 24px;" />
    <p style="margin:0 0 16px;color:#CBD5E1;font-size:14px;font-weight:600;">¿Qué sigue?</p>
    <ul style="margin:0 0 28px;padding-left:20px;color:#94A3B8;font-size:14px;line-height:1.8;">
      <li>Revisa tu sitio en el dashboard</li>
      <li>Haz ajustes con IA o editando las secciones</li>
      <li>Publícalo en Vercel con 1 click</li>
      <li>Conecta tu dominio personalizado</li>
    </ul>
    <div style="text-align:center;margin-bottom:8px;">
      ${btnPrimario('Ver mi sitio →', url)}
    </div>
  `)
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `¡Tu sitio "${sitioNombre}" está listo! 🚀`,
    html,
  })
}
