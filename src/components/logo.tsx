import { Gavel } from 'lucide-react';

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${inverted ? 'text-white' : 'text-primary'} ${className ?? ''}`}>
      <Gavel className="h-7 w-7 md:h-8 md:w-8 shrink-0" />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-headline text-lg md:text-xl font-bold tracking-tight">Dr. Adrián Bengolea</span>
        <span
          className={`font-headline text-[10px] md:text-[11px] font-semibold uppercase tracking-wide ${
            inverted ? 'text-white/75' : 'text-primary/70'
          }`}
        >
          Reclamos por planes de ahorro
        </span>
      </div>
    </div>
  );
}
