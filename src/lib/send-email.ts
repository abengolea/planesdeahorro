'use server';
import { Resend } from 'resend';
import type { CaseEvaluation } from '@/lib/types';
import {
  EMAIL_THEME,
  emailIntroHeading,
  emailKeyValueRows,
  emailParagraph,
  emailSectionTitle,
  escapeHtml,
  wrapEmailHtml,
} from '@/lib/email-layout';
import { getPublicAppUrl } from '@/lib/public-app-url';

// Configura RESEND_API_KEY en `.env.local` para enviar correos. Sin clave, el envío se omite sin romper la app.
/** Aviso de nueva evaluación de caso (siempre a esta bandeja). */
const NEW_CASE_INTERNAL_EMAIL = 'abengolea1@gmail.com';

const FROM_EMAIL = 'onboarding@resend.dev'; // Resend requiere un dominio verificado. `onboarding@resend.dev` es para pruebas.

/** Remitente para mails al cliente (dominio verificado en Resend). Si no se define, se usa FROM_EMAIL. */
function clientFromEmail(): string {
  return (process.env.RESEND_CLIENT_FROM ?? process.env.RESEND_FROM_EMAIL ?? FROM_EMAIL).trim();
}

const p =
  'margin:0 0 14px;font-family:\'Inter\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:15px;line-height:1.6;color:' +
  EMAIL_THEME.body;

function plainToParagraphs(text: string | undefined): string {
  if (!text?.trim()) return '';
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="${p}">${escapeHtml(line)}</p>`)
    .join('');
}

export type ClientCaseEmailKind = 'en_analisis' | 'aceptado' | 'rechazado' | 'derivado' | 'cerrado';

/**
 * Correo automático al usuario que envió la evaluación (plantillas por tipo de resolución).
 */
export async function sendClientCaseUpdateEmail(options: {
  to: string;
  nombre: string;
  kind: ClientCaseEmailKind;
  /** Texto plano del admin; se escapa y convierte en párrafos HTML. */
  messageFromAdmin?: string;
  /** Enlace para activar el área de cliente (típico al aceptar el caso). */
  portalActivationUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[send-email] RESEND_API_KEY no está definida; se omite el envío al cliente.');
    return { success: false, error: 'Servicio de correo no configurado' };
  }

  const resend = new Resend(apiKey);
  const from = clientFromEmail();
  const safeName = escapeHtml(options.nombre.trim() || 'cliente');
  const extraHtml = plainToParagraphs(options.messageFromAdmin);

  let subject: string;
  let coreHtml: string;

  switch (options.kind) {
    case 'en_analisis':
      subject = 'Dr. Adrián Bengolea — Estamos revisando tu consulta';
      coreHtml = `
        <p style="${p}">Hola ${safeName},</p>
        <p style="${p}">Te confirmamos que recibimos los datos de tu consulta y el equipo está revisando tu caso.</p>
        <p style="${p}">Te contactaremos por este correo o por el medio que indicaste cuando haya novedades.</p>
      `;
      break;
    case 'aceptado':
      subject = 'Dr. Adrián Bengolea — Próximos pasos en tu consulta';
      coreHtml = `
        <p style="${p}">Hola ${safeName},</p>
        <p style="${p}">Gracias por la información enviada. Podemos avanzar con el siguiente paso respecto de tu consulta.</p>
      `;
      break;
    case 'rechazado':
      subject = 'Dr. Adrián Bengolea — Actualización sobre tu consulta';
      coreHtml = `
        <p style="${p}">Hola ${safeName},</p>
        <p style="${p}">Te agradecemos el contacto. A continuación te detallamos la respuesta del estudio:</p>
      `;
      break;
    case 'derivado':
      subject = 'Dr. Adrián Bengolea — Información sobre tu consulta';
      coreHtml = `
        <p style="${p}">Hola ${safeName},</p>
        <p style="${p}">Te compartimos la siguiente información respecto de tu consulta:</p>
      `;
      break;
    case 'cerrado':
      subject = 'Dr. Adrián Bengolea — Cierre de tu consulta';
      coreHtml = `
        <p style="${p}">Hola ${safeName},</p>
        <p style="${p}">Damos por finalizada la gestión inicial vinculada a tu consulta en este canal.</p>
      `;
      break;
  }

  const portalUrl = options.portalActivationUrl?.trim();
  const portalBlock =
    portalUrl && options.kind === 'aceptado'
      ? `<p style="${p}"><strong>Portal del cliente:</strong> podés <a href="${escapeHtml(portalUrl)}" style="color:${EMAIL_THEME.primary};text-decoration:underline;">activar tu acceso en la web</a> para ver el estado, subir documentación y los movimientos del expediente. Usá el mismo correo con el que enviaste la consulta.</p>`
      : '';

  const inner = `${coreHtml}${portalBlock}${extraHtml}`;
  const html = wrapEmailHtml(inner, {
    variant: 'client',
    preheader: subject,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: `Dr. Adrián Bengolea <${from}>`,
      to: [options.to.trim()],
      subject,
      html,
    });

    if (error) {
      console.error('[send-email] Error al enviar mail al cliente:', error);
      return { success: false, error: 'Fallo al enviar el correo' };
    }

    console.log('[send-email] Mail al cliente enviado:', data);
    return { success: true };
  } catch (exception) {
    console.error('[send-email] Excepción al enviar mail al cliente:', exception);
    return { success: false, error: 'Error inesperado al enviar' };
  }
}

function caseEvaluationNotificationHtml(
  caseData: CaseEvaluation,
  options: { openInAdminUrl?: string } = {},
): string {
  const docs = caseData.documentacionDisponible.join(', ') || '—';
  const cta = options.openInAdminUrl
    ? `
    <p style="margin:0 0 18px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;color:${EMAIL_THEME.body};">
      <a href="${escapeHtml(options.openInAdminUrl)}" style="display:inline-block;padding:10px 18px;background:${EMAIL_THEME.primary};color:${EMAIL_THEME.primaryFg};text-decoration:none;border-radius:6px;font-weight:600;">Abrir en el panel de administración</a>
    </p>
  `
    : '';

  return `
    ${emailIntroHeading('Nueva evaluación de caso')}
    ${emailParagraph('Se recibió una consulta a través del asistente de evaluación. A continuación, el detalle registrado.')}
    ${cta}
    ${emailSectionTitle('Datos del contacto')}
    ${emailKeyValueRows([
      { label: 'Nombre', value: caseData.nombre },
      { label: 'WhatsApp', value: caseData.whatsapp },
      { label: 'Email', value: caseData.email },
      { label: 'Ciudad / Provincia', value: `${caseData.ciudad}, ${caseData.provincia}` },
    ])}
    ${emailSectionTitle('Datos del plan')}
    ${emailKeyValueRows([
      { label: 'Administradora', value: caseData.administradora },
      { label: 'Estado del plan', value: caseData.estadoPlan },
      { label: 'Adjudicado', value: caseData.adjudicado },
      { label: 'Vehículo recibido', value: caseData.vehiculoRecibido },
      { label: 'Grupo y orden', value: caseData.grupoOrden || 'No especificado' },
    ])}
    ${emailSectionTitle('Resumen del caso')}
    ${emailKeyValueRows([{ label: 'Problema principal', value: caseData.problemaPrincipal }])}
    ${emailParagraph(caseData.resumenHechos)}
    ${emailSectionTitle('Análisis automático (IA)')}
    ${emailKeyValueRows([
      { label: 'Nivel de urgencia', value: caseData.urgencia },
      { label: 'Motivo de urgencia', value: caseData.motivoUrgencia || 'N/A' },
      { label: 'Documentación disponible', value: docs },
      { label: 'Posible categoría jurídica', value: caseData.posibleCategoriaJuridica },
      { label: 'Próxima acción sugerida', value: caseData.proximaAccionSugerida },
    ])}
  `;
}

export async function sendCaseEvaluationEmail(
  caseData: CaseEvaluation,
  options?: { evaluationId?: string },
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[send-email] RESEND_API_KEY no está definida; se omite el envío de notificación.',
    );
    return { success: false, error: 'Email service not configured' };
  }

  const resend = new Resend(apiKey);
  const from = clientFromEmail();
  const to = [NEW_CASE_INTERNAL_EMAIL];
  const subject = `Nueva evaluación de caso – Plan de ahorro – ${caseData.nombre} – ${caseData.administradora}`;

  const openInAdminUrl =
    options?.evaluationId != null && String(options.evaluationId).length > 0
      ? `${getPublicAppUrl()}/admin/evaluaciones-caso/${encodeURIComponent(String(options.evaluationId))}`
      : undefined;

  const inner = caseEvaluationNotificationHtml(caseData, { openInAdminUrl });
  const html = wrapEmailHtml(inner, {
    variant: 'internal',
    preheader: `${caseData.nombre} · ${caseData.administradora}`,
    showSignature: false,
    footerNote:
      'Correo generado automáticamente por el sistema del sitio. Reservado para uso del estudio.',
  });

  try {
    const { data, error } = await resend.emails.send({
      from: `Dr. Adrián Bengolea <${from}>`,
      to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: 'Failed to send email' };
    }

    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (exception) {
    console.error('Exception sending email:', exception);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
