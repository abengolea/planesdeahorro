import { cn } from '@/lib/utils';

export function SkipLink() {
  return (
    <a
      href="#main"
      className={cn(
        'font-body pointer-events-none fixed left-4 top-0 z-[100] -translate-y-20 rounded-md bg-brand px-4 py-3',
        'text-sm font-medium text-brand-foreground shadow-md opacity-0 transition',
        'focus:pointer-events-auto focus:translate-y-4 focus:opacity-100',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
      )}
    >
      Saltar al contenido
    </a>
  );
}
