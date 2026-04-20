import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-legal-ruling-flow.ts';
import '@/ai/flows/summarize-doctrine-document-flow.ts';
import '@/ai/flows/draft-doctrine-article-outline.ts';
import '@/ai/flows/case-evaluation-flow.ts';
import '@/ai/flows/draft-accept-case-client-message-flow.ts';
