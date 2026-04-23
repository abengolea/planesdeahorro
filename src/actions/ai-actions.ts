'use server';

import {
  summarizeLegalRuling,
  type SummarizeLegalRulingInput,
  type SummarizeLegalRulingOutput,
} from '@/ai/flows/summarize-legal-ruling-flow';
import {
  extractTextFromPdfBuffer,
  classifyPdfError,
  MAX_PDF_BYTES,
} from '@/lib/pdf/extract-text-from-pdf';
import { stripExpedienteBoilerplateFromText } from '@/lib/legal/strip-expediente-boilerplate';
import {
  draftDoctrineArticleOutline,
  type DraftDoctrineArticleOutlineInput,
  type DraftDoctrineArticleOutlineOutput
} from '@/ai/flows/draft-doctrine-article-outline';
import {
  describeKnowledgeDoc,
  type DescribeKnowledgeDocInput,
  type DescribeKnowledgeDocOutput,
} from '@/ai/flows/describe-knowledge-doc-flow';
import {
  summarizeDoctrineDocument,
  type SummarizeDoctrineDocumentOutput,
} from '@/ai/flows/summarize-doctrine-document-flow';
import type { ServerActionResponse } from '@/lib/types';
import { userFacingAiErrorMessage } from '@/ai/llm-retry';

/** Evita exceder contexto del modelo con PDFs muy largos (doctrina y fallos). */
const MAX_PDF_ANALYSIS_TEXT_CHARS = 120_000;

export async function summarizeRulingAction(
  input: SummarizeLegalRulingInput
): Promise<ServerActionResponse<SummarizeLegalRulingOutput>> {
  try {
    const data = await summarizeLegalRuling(input);
    return { data, error: null };
  } catch (err) {
    console.error('[AI Action] summarizeRulingAction failed:', err);
    return {
      data: null,
      error: userFacingAiErrorMessage(
        err,
        'No se pudo generar el resumen con IA. Verifique el contenido o intente de nuevo.'
      ),
    };
  }
}

export async function draftOutlineAction(
  input: DraftDoctrineArticleOutlineInput
): Promise<ServerActionResponse<DraftDoctrineArticleOutlineOutput>> {
  try {
    const data = await draftDoctrineArticleOutline(input);
    return { data, error: null };
  } catch (err) {
    console.error('[AI Action] draftOutlineAction failed:', err);
    return { data: null, error: 'No se pudo generar el esquema con IA. Verifique el tema o intente de nuevo.' };
  }
}

export async function describeKnowledgeDocAction(
  input: DescribeKnowledgeDocInput
): Promise<ServerActionResponse<DescribeKnowledgeDocOutput>> {
  try {
    const data = await describeKnowledgeDoc(input);
    return { data, error: null };
  } catch (err) {
    console.error('[AI Action] describeKnowledgeDocAction failed:', err);
    return { data: null, error: 'No se pudo generar la descripción con IA. Intentá de nuevo.' };
  }
}

/** Resultado de subir un PDF: texto extraído + análisis (resumen, etiquetas, sugerencias). */
export type AnalyzeFalloPdfResult = SummarizeLegalRulingOutput & {
  extractedText: string;
  fileName: string;
};

/**
 * Recibe un PDF por FormData (`file`), extrae texto en el servidor y ejecuta el mismo flujo de IA que el texto pegado a mano.
 */
export async function analyzeFalloPdfAction(
  formData: FormData
): Promise<ServerActionResponse<AnalyzeFalloPdfResult>> {
  try {
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return { data: null, error: 'Seleccioná un archivo PDF.' };
    }
    if (file.size > MAX_PDF_BYTES) {
      return {
        data: null,
        error: `El PDF supera el tamaño máximo (${Math.floor(MAX_PDF_BYTES / (1024 * 1024))} MB).`,
      };
    }
    const mime = file.type?.toLowerCase() ?? '';
    const name = file.name?.toLowerCase() ?? '';
    if (mime !== 'application/pdf' && !name.endsWith('.pdf')) {
      return { data: null, error: 'El archivo debe ser un PDF (.pdf).' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText: string;
    try {
      const raw = await extractTextFromPdfBuffer(buffer);
      extractedText = stripExpedienteBoilerplateFromText(raw);
    } catch (err) {
      console.error('[AI Action] PDF extract failed:', err);
      return { data: null, error: classifyPdfError(err) };
    }

    if (extractedText.length < 80) {
      return {
        data: null,
        error:
          'Se extrajo muy poco texto del PDF (puede ser un escaneo sin OCR o una imagen). Copiá el texto manualmente o usá un PDF con texto seleccionable.',
      };
    }

    const forModel =
      extractedText.length > MAX_PDF_ANALYSIS_TEXT_CHARS
        ? `${extractedText.slice(0, MAX_PDF_ANALYSIS_TEXT_CHARS)}\n\n[… Texto truncado por longitud …]`
        : extractedText;

    const aiResult = await summarizeLegalRuling({ rulingText: forModel });

    return {
      data: {
        ...aiResult,
        extractedText,
        fileName: file.name || 'documento.pdf',
      },
      error: null,
    };
  } catch (err) {
    console.error('[AI Action] analyzeFalloPdfAction failed:', err);
    return {
      data: null,
      error: userFacingAiErrorMessage(
        err,
        'No se pudo procesar el PDF. Intentá de nuevo o pegá el texto del fallo a mano.'
      ),
    };
  }
}

/** Resultado de analizar un PDF de doctrina: campos para el formulario + texto extraído. */
export type AnalyzeDoctrinePdfResult = SummarizeDoctrineDocumentOutput & {
  extractedText: string;
  fileName: string;
};

/**
 * Extrae texto del PDF y genera resumen, etiquetas y cuerpo en Markdown con IA (doctrina, no fallos).
 */
export async function analyzeDoctrinePdfAction(
  formData: FormData
): Promise<ServerActionResponse<AnalyzeDoctrinePdfResult>> {
  try {
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return { data: null, error: 'Seleccioná un archivo PDF.' };
    }
    if (file.size > MAX_PDF_BYTES) {
      return {
        data: null,
        error: `El PDF supera el tamaño máximo (${Math.floor(MAX_PDF_BYTES / (1024 * 1024))} MB).`,
      };
    }
    const mime = file.type?.toLowerCase() ?? '';
    const name = file.name?.toLowerCase() ?? '';
    if (mime !== 'application/pdf' && !name.endsWith('.pdf')) {
      return { data: null, error: 'El archivo debe ser un PDF (.pdf).' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText: string;
    try {
      extractedText = await extractTextFromPdfBuffer(buffer);
    } catch (err) {
      console.error('[AI Action] doctrine PDF extract failed:', err);
      return { data: null, error: classifyPdfError(err) };
    }

    if (extractedText.length < 80) {
      return {
        data: null,
        error:
          'Se extrajo muy poco texto del PDF (puede ser un escaneo sin OCR). Usá un PDF con texto seleccionable o pegá el contenido manualmente.',
      };
    }

    const forModel =
      extractedText.length > MAX_PDF_ANALYSIS_TEXT_CHARS
        ? `${extractedText.slice(0, MAX_PDF_ANALYSIS_TEXT_CHARS)}\n\n[… Texto truncado por longitud …]`
        : extractedText;

    const aiResult = await summarizeDoctrineDocument({ documentText: forModel });

    return {
      data: {
        ...aiResult,
        extractedText,
        fileName: file.name || 'documento.pdf',
      },
      error: null,
    };
  } catch (err) {
    console.error('[AI Action] analyzeDoctrinePdfAction failed:', err);
    return {
      data: null,
      error: userFacingAiErrorMessage(
        err,
        'No se pudo procesar el documento con IA. Intentá de nuevo o completá el texto a mano.'
      ),
    };
  }
}
