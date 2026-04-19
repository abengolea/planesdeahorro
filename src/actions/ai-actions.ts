'use server';

import { 
  summarizeLegalRuling, 
  type SummarizeLegalRulingInput, 
  type SummarizeLegalRulingOutput 
} from '@/ai/flows/summarize-legal-ruling-flow';
import { 
  draftDoctrineArticleOutline, 
  type DraftDoctrineArticleOutlineInput, 
  type DraftDoctrineArticleOutlineOutput 
} from '@/ai/flows/draft-doctrine-article-outline';
import type { ServerActionResponse } from '@/lib/types';

export async function summarizeRulingAction(
  input: SummarizeLegalRulingInput
): Promise<ServerActionResponse<SummarizeLegalRulingOutput>> {
  try {
    const data = await summarizeLegalRuling(input);
    return { data, error: null };
  } catch (err) {
    console.error('[AI Action] summarizeRulingAction failed:', err);
    return { data: null, error: 'No se pudo generar el resumen con IA. Verifique el contenido o intente de nuevo.' };
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
