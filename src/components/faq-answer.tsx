import { cn } from '@/lib/utils';

type Props = {
  text: string;
  className?: string;
};

/** Parte respuestas en párrafos según saltos dobles de línea. */
export function FaqAnswer({ text, className }: Props) {
  const paragraphs = text.split(/\n\n/).filter(Boolean);
  return (
    <div className={cn('text-muted-foreground', className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="last:mb-0 mb-3">
          {p}
        </p>
      ))}
    </div>
  );
}
