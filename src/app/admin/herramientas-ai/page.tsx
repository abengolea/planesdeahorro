import { AiToolsClient } from './ai-tools-client';
import { siteContainer, siteAdminY } from '@/lib/site-layout';
import { cn } from '@/lib/utils';

export default function AiToolsPage() {
  return (
    <div className={cn(siteContainer, siteAdminY)}>
      <div className="mb-8 border-b border-border pb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-accent mb-2">Herramientas</p>
        <h1 className="font-headline text-3xl md:text-4xl text-primary">Herramientas con IA</h1>
        <div className="w-10 h-0.5 bg-accent mt-4" />
        <p className="text-muted-foreground mt-4 max-w-2xl">
          Resúmenes y esquemas con IA, usando como referencia los fallos y artículos de doctrina que ya cargaste en el panel
          (los más recientes, en extracto).
        </p>
      </div>
      <AiToolsClient />
    </div>
  );
}
