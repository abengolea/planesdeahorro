'use server';
import { Resend } from 'resend';
import type { CaseEvaluation } from '@/lib/types';

// Configura RESEND_API_KEY en `.env.local` para enviar correos. Sin clave, el envío se omite sin romper la app.
const TO_EMAIL = 'abengolea1@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev'; // Resend requiere un dominio verificado. `onboarding@resend.dev` es para pruebas.
/** Remitente para mails al cliente (dominio verificado en Resend). Si no se define, se usa FROM_EMAIL. */
function clientFromEmail(): string {
  return (process.env.RESEND_CLIENT_FROM ?? process.env.RESEND_FROM_EMAIL ?? FROM_EMAIL).trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainToParagraphs(text: string | undefined): string {
  if (!text?.trim()) return '';
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
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
      subject = 'Adrián Bengolea — Estamos revisando tu consulta';
      coreHtml = `
        <p>Hola ${safeName},</p>
        <p>Te confirmamos que recibimos los datos de tu consulta y el equipo está revisando tu caso.</p>
        <p>Te contactaremos por este correo o por el medio que indicaste cuando haya novedades.</p>
      `;
      break;
    case 'aceptado':
      subject = 'Adrián Bengolea — Próximos pasos en tu consulta';
      coreHtml = `
        <p>Hola ${safeName},</p>
        <p>Gracias por la información enviada. Podemos avanzar con el siguiente paso respecto de tu consulta.</p>
      `;
      break;
    case 'rechazado':
      subject = 'Adrián Bengolea — Actualización sobre tu consulta';
      coreHtml = `
        <p>Hola ${safeName},</p>
        <p>Te agradecemos el contacto. A continuación te detallamos la respuesta del estudio:</p>
      `;
      break;
    case 'derivado':
      subject = 'Adrián Bengolea — Información sobre tu consulta';
      coreHtml = `
        <p>Hola ${safeName},</p>
        <p>Te compartimos la siguiente información respecto de tu consulta:</p>
      `;
      break;
    case 'cerrado':
      subject = 'Adrián Bengolea — Cierre de tu consulta';
      coreHtml = `
        <p>Hola ${safeName},</p>
        <p>Damos por finalizada la gestión inicial vinculada a tu consulta en este canal.</p>
      `;
      break;
  }

  const footer = `
    <p style="margin-top:24px;font-size:12px;color:#666;">
      Este mensaje es informativo y no constituye asesoramiento jurídico sin un contrato de prestación de servicios.
    </p>
  `;

  const body = `<div style="font-family:sans-serif;line-height:1.5;color:#111;">${coreHtml}${extraHtml}${footer}</div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `Adrián Bengolea <${from}>`,
      to: [options.to.trim()],
      subject,
      html: body,
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

export async function sendCaseEvaluationEmail(caseData: CaseEvaluation) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[send-email] RESEND_API_KEY no está definida; se omite el envío de notificación.',
    );
    return { success: false, error: 'Email service not configured' };
  }

  const resend = new Resend(apiKey);
  const subject = `Nueva evaluación de caso – Plan de ahorro – ${caseData.nombre} – ${caseData.administradora}`;

  const body = `
    <h1>Nueva Evaluación de Caso Recibida</h1>
    <p>Se ha recibido una nueva consulta a través del asistente de evaluación de Adrián Bengolea.</p>
    
    <h2>Datos del Cliente</h2>
    <ul>
      <li><strong>Nombre:</strong> ${caseData.nombre}</li>
      <li><strong>WhatsApp:</strong> ${caseData.whatsapp}</li>
      <li><strong>Email:</strong> ${caseData.email}</li>
      <li><strong>Ciudad/Provincia:</strong> ${caseData.ciudad}, ${caseData.provincia}</li>
    </ul>

    <h2>Datos del Plan</h2>
    <ul>
      <li><strong>Administradora:</strong> ${caseData.administradora}</li>
      <li><strong>Estado del Plan:</strong> ${caseData.estadoPlan}</li>
      <li><strong>Adjudicado:</strong> ${caseData.adjudicado}</li>
      <li><strong>Vehículo Recibido:</strong> ${caseData.vehiculoRecibido}</li>
      <li><strong>Grupo y Orden:</strong> ${caseData.grupoOrden || 'No especificado'}</li>
    </ul>

    <h2>Resumen del Caso</h2>
    <ul>
      <li><strong>Problema Principal:</strong> ${caseData.problemaPrincipal}</li>
      <li><strong>Resumen de Hechos por IA:</strong>
        <p>${caseData.resumenHechos}</p>
      </li>
    </ul>
    
    <h2>Análisis de IA</h2>
    <ul>
      <li><strong>Nivel de Urgencia:</strong> ${caseData.urgencia}</li>
      <li><strong>Motivo de Urgencia:</strong> ${caseData.motivoUrgencia || 'N/A'}</li>
      <li><strong>Documentación Disponible:</strong> ${caseData.documentacionDisponible.join(', ')}</li>
      <li><strong>Posible Categoría Jurídica:</strong> ${caseData.posibleCategoriaJuridica}</li>
      <li><strong>Próxima Acción Sugerida:</strong> ${caseData.proximaAccionSugerida}</li>
    </ul>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `Adrián Bengolea <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error('Error sending email:', error);
      // En un caso real, aquí podrías reintentar o notificar a un sistema de monitoreo.
      return { success: false, error: 'Failed to send email' };
    }

    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (exception) {
    console.error('Exception sending email:', exception);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
