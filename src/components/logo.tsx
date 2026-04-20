import { Gavel } from 'lucide-react';

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${inverted ? 'text-white' : 'text-primary'} ${className ?? ''}`}>
      <Gavel className="h-6 w-6 md:h-7 md:w-7 shrink-0" />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-headline text-base md:text-lg font-bold tracking-tight">Adrián Bengolea</span>
        <span
          className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-wide ${
            inverted ? 'text-white/75' : 'text-primary/70'
          }`}
        >
          Reclamos por planes de ahorro
        </span>
      </div>
    </div>
  );
}
