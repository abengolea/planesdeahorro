/**
 * Ejecuta el primer turno del flujo evaluateCase con distintos relatos de usuario
 * (mismo historial que la web: mensaje inicial del asistente + primer mensaje del usuario).
 *
 * Uso (PowerShell):
 *   $env:NODE_OPTIONS="--require ./scripts/register-empty-server-only.cjs"
 *   npx tsx scripts/evaluate-case-chat-scenarios.ts
 *
 * Requiere GEMINI_API_KEY / GOOGLE_API_KEY u OPENAI_API_KEY en .env.local
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { CASE_EVAL_INITIAL_ASSISTANT_CONTENT } from '@/lib/case-eval-chat-constants';
import { evaluateCase } from '@/ai/flows/case-evaluation-flow';
import type { ChatMessage } from '@/lib/types';

config({ path: resolve(process.cwd(), '.env.local') });

const SCENARIOS: { id: string; label: string; userMessage: string }[] = [
  {
    id: '1',
    label: 'Rescisión + liquidación lesiva (Ford, detalle)',
    userMessage:
      'Tengo un plan Ford en La Plata, hace 3 años. Me rescindieron por 2 cuotas atrasadas y en la liquidación me devolvieron una miseria, no llega ni a la mitad de lo que puse. Tengo el contrato y los recibos.',
  },
  {
    id: '2',
    label: 'Urgencia: secuestro del auto',
    userMessage:
      'Me quieren llevar el Ranger adjudicado, ya me mandaron gente de la grúa. Vivo en Quilmes, plan Óvalo. ¿Qué hago?',
  },
  {
    id: '3',
    label: 'Rechazo esperado: solo aumento de cuota',
    userMessage:
      'Solo quería consultar porque me subieron muchísimo la cuota del plan Chevrolet por la actualización del vehículo. No me rescindieron ni nada.',
  },
  {
    id: '4',
    label: 'Seguros obligatorios caros (Toyota)',
    userMessage:
      'Plan Toyota en Mar del Plata. Me obligan a pagar un seguro del auto por el plan que es recontra caro comparado con el mercado. El auto todavía no lo tengo, estoy pagando cuotas.',
  },
  {
    id: '5',
    label: 'Haberes netos (descuento en sueldo)',
    userMessage:
      'Trabajo en relación de dependencia y me descuentan la cuota del plan Fiat directo del recibo de sueldo sin que yo haya autorizado eso así. Soy de Pilar.',
  },
  {
    id: '6',
    label: 'Ámbito: CABA explícito',
    userMessage:
      'Vivo en Palermo, CABA. Plan Rombo, me rescindieron y la liquidación es una vergüenza. Necesito ayuda.',
  },
  {
    id: '7',
    label: 'Ámbito: otra provincia',
    userMessage:
      'Soy de Neuquén capital, plan Peugeot. No me entregan el auto que adjudiqué hace 8 meses.',
  },
  {
    id: '8',
    label: 'Adjudicación sin entrega',
    userMessage:
      'Adjudicé un Cronos FCA en febrero, soy de Bahía Blanca, y la administradora me dice que no hay unidades y me quieren cambiar el modelo.',
  },
  {
    id: '9',
    label: 'Urgencia: mediación con fecha',
    userMessage:
      'Tengo mediación el viernes con Nissan Plan por una deuda que no entiendo. Vivo en Lomas de Zamora. Me intimaron por carta documento.',
  },
  {
    id: '10',
    label: 'Relato vago',
    userMessage: 'Hola, tengo un problema con mi plan de ahorro pero no sé bien cómo explicarlo.',
  },
  {
    id: '11',
    label: 'Multimarca sin marca',
    userMessage:
      'Tengo un plan multimarca en Tandil, me liquidaron mal cuando rescindí. No recuerdo bien el nombre de la empresa en el papel.',
  },
  {
    id: '12',
    label: 'Marca fuera del mapeo (BMW)',
    userMessage:
      'Plan BMW en San Isidro, cláusulas que me perjudican y me quieren ejecutar la prenda. Tengo abogado ya pero quiero segunda opinión.',
  },
  {
    id: '13',
    label: 'Usuario angustiado',
    userMessage:
      'No doy más, estoy con ataques de pánico. Renault en Ensenada, me sacaron el auto y dicen que debo fortunas. No sé qué hacer.',
  },
  {
    id: '14',
    label: 'Varios problemas a la vez',
    userMessage:
      'Chevrolet en Merlo: rescisión, liquidación que no cierra, y encima me cargaron un seguro de vida altísimo. Y me intimaron.',
  },
  {
    id: '15',
    label: 'Intimación plazo corto',
    userMessage:
      'Me llegó una intimación de Volkswagen SAFD con plazo de 72 horas para pagar o me secuestran el vehículo. Morón, provincia de Buenos Aires.',
  },
  {
    id: '16',
    label: 'Ejecución prendaria anunciada',
    userMessage:
      'Citroën en La Matanza, ya adjudicado, me notificaron ejecución prendaria por una supuesta deuda de cuotas que yo discuto.',
  },
  {
    id: '17',
    label: 'Consulta exploratoria corta',
    userMessage: 'Quería saber si ustedes toman planes de ahorro con devolución en pesos.',
  },
  {
    id: '18',
    label: 'Liquidación demorada',
    userMessage:
      'Rescindí el plan Toyota hace 10 meses en Olavarría y todavía no me liquidaron los haberes. Tengo mails y denuncia en Defensa del Consumidor sin respuesta.',
  },
  {
    id: '19',
    label: 'Mora y cuotas (dimensionar)',
    userMessage:
      'Plan Chevrolet, González Catán. Estoy en mora de 4 cuotas y me quieren rescindir. Llevaba 40 cuotas pagas.',
  },
  {
    id: '20',
    label: 'Cláusula abusiva genérica',
    userMessage:
      'El contrato del plan Peugeot en San Nicolás tiene una cláusula que me parece abusiva sobre penalidades si me atraso un mes. Quiero saber si pueden ayudarme.',
  },
];

function buildHistory(userContent: string): ChatMessage[] {
  return [
    { id: 'inicio', role: 'assistant', content: CASE_EVAL_INITIAL_ASSISTANT_CONTENT },
    { id: 'u1', role: 'user', content: userContent },
  ];
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function evaluateWithRetry(history: ChatMessage[], maxAttempts = 4) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await evaluateCase(history);
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const retryable =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('429') ||
        msg.toLowerCase().includes('resource_exhausted');
      if (!retryable || attempt === maxAttempts) throw e;
      const backoff = 2000 * attempt ** 2;
      console.warn(`[reintento ${attempt}/${maxAttempts - 1}] esperando ${backoff}ms…`);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

async function main() {
  console.log('=== Escenarios primer turno (evaluateCase) ===\n');
  const results: {
    id: string;
    label: string;
    nextMessage: string;
    quickReplies?: string[];
    isFinished: boolean;
    hasStructured: boolean;
    error?: string;
  }[] = [];

  for (const s of SCENARIOS) {
    try {
      const out = await evaluateWithRetry(buildHistory(s.userMessage));
      results.push({
        id: s.id,
        label: s.label,
        nextMessage: out.nextMessage,
        quickReplies: out.quickReplies,
        isFinished: out.isFinished,
        hasStructured: Boolean(out.structuredData),
      });
      console.log(`[OK] ${s.id} ${s.label}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        id: s.id,
        label: s.label,
        nextMessage: '',
        isFinished: false,
        hasStructured: false,
        error: msg,
      });
      console.error(`[ERR] ${s.id}: ${msg}`);
    }
    await sleep(800);
  }

  console.log('\n\n========== SALIDAS COMPLETAS ==========\n');
  for (const r of results) {
    console.log(`\n--- ${r.id}. ${r.label} ---`);
    if (r.error) {
      console.log('ERROR:', r.error);
      continue;
    }
    console.log('isFinished:', r.isFinished, '| structuredData:', r.hasStructured);
    if (r.quickReplies?.length) console.log('quickReplies:', JSON.stringify(r.quickReplies));
    console.log('nextMessage:\n', r.nextMessage);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
