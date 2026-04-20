import type { Timestamp } from 'firebase/firestore';
import type { CaseEvaluationStatus } from '@/lib/case-evaluation-status';

export interface Fallo {
  id: string; // Document ID from Firestore
  slug: string;
  title: string;
  summary: string;
  tribunal: string;
  date: string; // ISO date string
  tags: string[];
  content: string;
  published: boolean;
  /** URL de descarga del PDF original en Firebase Storage (opcional). */
  pdfUrl?: string;
  /** Ruta en el bucket, p. ej. `fallos/{id}/original.pdf`, para reemplazar o borrar. */
  pdfStoragePath?: string;
  /** Nombre del archivo subido (solo referencia para el admin). */
  pdfFileName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  content: string;
}

/** Documento en la colección Firestore `doctrina` (blog jurídico). */
export interface DoctrinaArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  authorId: string;
  /** Nombre visible (desnormalizado para el sitio público). */
  authorName: string;
  publishDate: string;
  tags?: string[];
  published: boolean;
  /** URL de descarga del PDF original en Firebase Storage (opcional). */
  pdfUrl?: string;
  /** Ruta en el bucket, p. ej. `doctrina/{id}/original.pdf`. */
  pdfStoragePath?: string;
  /** Nombre del archivo subido (referencia en el admin). */
  pdfFileName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FAQ {
  question: string;
  answer: string;
  /** Prioridad para el bloque de FAQ en la página de inicio (hasta 4 ítems con `true`). */
  highlight?: boolean;
}

/** Agrupa preguntas por tema (p. ej. contratación, liquidación). */
export interface FaqSection {
  id: string;
  title: string;
  description?: string;
  items: FAQ[];
}

export interface FrequentProblem {
  slug: string;
  title: string;
  description: string;
}

/** Video de YouTube listado en /videos (usar solo el ID, p. ej. de watch?v=XXXX). */
export interface YoutubeVideo {
  youtubeId: string;
  title: string;
  description?: string;
}

// Estructura del JSON que devuelve el flujo de IA
export interface CaseEvaluation {
  nombre: string;
  whatsapp: string;
  email: string;
  ciudad: string;
  provincia: string;
  administradora: string;
  estadoPlan: string;
  adjudicado: string;
  vehiculoRecibido: string;
  grupoOrden: string;
  problemaPrincipal: string;
  resumenHechos: string;
  documentacionDisponible: string[];
  urgencia: 'alta' | 'media' | 'baja';
  motivoUrgencia: string;
  posibleCategoriaJuridica: string;
  proximaAccionSugerida: string;
}

/** Documento en `case_evaluations` (datos del flujo + metadatos de guardado). */
export interface CaseEvaluationSubmission extends CaseEvaluation {
  id?: string;
  sessionId?: string | null;
  /** Origen del contacto (web o WhatsApp vía NotificasHub). */
  channel?: 'web' | 'whatsapp';
  /** Teléfono normalizado (solo dígitos) si vino por WhatsApp. */
  whatsappFrom?: string | null;
  /** Tenant en NotificasHub que enrutó el mensaje. */
  notificasTenantId?: string | null;
  createdAt?: Timestamp;
  /** Estado del pipeline de gestión; puede haber valores antiguos no listados en `CaseEvaluationStatus`. */
  status?: CaseEvaluationStatus | string;
  statusUpdatedAt?: Timestamp;
  statusUpdatedByUid?: string;
  statusUpdatedByEmail?: string | null;
  /** Nota interna del último cambio (solo panel admin). */
  adminInternalNote?: string;
  lastClientNotifiedAt?: Timestamp;
  lastClientNotifiedKind?: string;
}

// Tipo para los mensajes en el chat
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  quickReplies?: string[];
  isFinished?: boolean;
};

/** Documento de conocimiento para alimentar el contexto de la IA. Solo accesible por admins. */
export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  active: boolean; // Si true, se inyecta como contexto en el flujo de evaluación de casos
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Tipo genérico para respuestas de Server Actions
export type ServerActionResponse<T> = {
  data: T | null;
  error: string | null;
};
