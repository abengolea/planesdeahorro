/**
 * Plantilla HTML para correos transaccionales (Resend).
 * Colores y tipografías alineados con `globals.css` / sitio (Inter + EB Garamond).
 */

export const EMAIL_THEME = {
  /** hsl(218, 65%, 18%) */
  primary: '#102f5e',
  primaryFg: '#ffffff',
  /** hsl(40, 68%, 48%) */
  accent: '#d4a83a',
  /** ~ foreground */
  body: '#2b3340',
  muted: '#5a6370',
  subtle: '#8b939e',
  border: '#e6e9ef',
  pageBg: '#f0f2f6',
  cardBg: '#ffffff',
} as const;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FONT_LINK = `https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap`;

const fontBody = `'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
const fontHeadline = `'EB Garamond',Georgia,'Times New Roman',serif`;

export type EmailLayoutVariant = 'client' | 'internal';

export function wrapEmailHtml(
  mainContentHtml: string,
  options: {
    variant?: EmailLayoutVariant;
    /** Texto oculto para vista previa en bandeja (opcional). */
    preheader?: string;
    /** Leyenda bajo la firma; si no se pasa, se usa el disclaimer legal estándar. */
    footerNote?: string;
    /** Si false, no muestra bloque de firma (solo nota al pie). */
    showSignature?: boolean;
  } = {},
): string {
  const variant = options.variant ?? 'client';
  const showSignature = options.showSignature !== false;
  const footerNote =
    options.footerNote ??
    'Este mensaje es informativo y no constituye asesoramiento jurídico sin un contrato de prestación de servicios.';

  const badge =
    variant === 'internal'
      ? `<div style="font-family:${fontBody};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_THEME.accent};margin-top:10px;">Notificación del sistema</div>`
      : '';

  const preheaderBlock = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:transparent;width:0;height:0;">${escapeHtml(options.preheader)}</div>`
    : '';

  const signatureBlock = showSignature
    ? `
    <tr>
      <td style="padding:0 28px 8px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid ${EMAIL_THEME.border};">
          <tr>
            <td style="padding-top:22px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:3px;background:${EMAIL_THEME.accent};border-radius:1px;font-size:0;line-height:0;">&nbsp;</td>
                  <td style="padding-left:14px;">
                    <div style="font-family:${fontHeadline};font-size:20px;font-weight:700;color:${EMAIL_THEME.primary};line-height:1.2;">Dr. Adrián Bengolea</div>
                    <div style="font-family:${fontBody};font-size:13px;font-weight:500;color:${EMAIL_THEME.muted};margin-top:6px;line-height:1.4;">Abogado — Especialista en Planes de Ahorro</div>
                    <div style="font-family:${fontBody};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_THEME.subtle};margin-top:8px;">Reclamos por planes de ahorro</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONT_LINK}" rel="stylesheet">
  <title></title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_THEME.pageBg};-webkit-text-size-adjust:100%;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_THEME.pageBg};border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:${EMAIL_THEME.cardBg};border-collapse:collapse;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(16,47,94,0.08);border:1px solid ${EMAIL_THEME.border};">
          <tr>
            <td style="padding:0;background:${EMAIL_THEME.primary};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:4px;background:${EMAIL_THEME.accent};font-size:0;line-height:0;">&nbsp;</td>
                  <td style="padding:24px 26px 22px;">
                    <div style="font-family:${fontHeadline};font-size:24px;font-weight:700;color:${EMAIL_THEME.primaryFg};line-height:1.15;letter-spacing:-0.02em;">Dr. Adrián Bengolea</div>
                    <div style="font-family:${fontBody};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.78);margin-top:8px;line-height:1.3;">Reclamos por planes de ahorro</div>
                    ${badge}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;font-family:${fontBody};font-size:15px;line-height:1.6;color:${EMAIL_THEME.body};">
              ${mainContentHtml}
            </td>
          </tr>
          ${signatureBlock}
          <tr>
            <td style="padding:8px 28px 28px;font-family:${fontBody};font-size:11px;line-height:1.5;color:${EMAIL_THEME.subtle};">
              ${escapeHtml(footerNote)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Título de sección para mails internos (estilo tarjeta). */
export function emailSectionTitle(text: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 12px;border-collapse:collapse;">
    <tr>
      <td style="font-family:${fontHeadline};font-size:17px;font-weight:700;color:${EMAIL_THEME.primary};padding:0 0 8px;border-bottom:2px solid ${EMAIL_THEME.accent};">${escapeHtml(text)}</td>
    </tr>
  </table>`;
}

export function emailKeyValueRows(rows: { label: string; value: string }[]): string {
  const rowHtml = rows
    .map(
      (r) => `<tr>
      <td style="padding:8px 0;vertical-align:top;font-family:${fontBody};font-size:13px;font-weight:600;color:${EMAIL_THEME.muted};width:38%;border-bottom:1px solid ${EMAIL_THEME.border};">${escapeHtml(r.label)}</td>
      <td style="padding:8px 0 8px 14px;vertical-align:top;font-family:${fontBody};font-size:13px;color:${EMAIL_THEME.body};border-bottom:1px solid ${EMAIL_THEME.border};">${escapeHtml(r.value)}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 8px;">${rowHtml}</table>`;
}

export function emailParagraph(text: string): string {
  const safe = escapeHtml(text).replace(/\n/g, '<br>');
  return `<p style="margin:0 0 14px;font-family:${fontBody};font-size:14px;line-height:1.55;color:${EMAIL_THEME.body};">${safe}</p>`;
}

export function emailIntroHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${fontHeadline};font-size:22px;font-weight:700;color:${EMAIL_THEME.primary};line-height:1.25;">${escapeHtml(text)}</h1>`;
}
