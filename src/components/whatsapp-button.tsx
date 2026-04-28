'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    fill="currentColor"
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 69.5 13.6 10.7-1.4 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

const DEFAULT_PREFILL =
  'Hola, quiero consultar por Planes de Ahorro - Dr. Bengolea.';

/**
 * Línea de contacto (Argentina): 10 dígitos locales; para wa.me hace falta `549` + estos dígitos.
 * Sobreescribible con `NEXT_PUBLIC_WHATSAPP_NUMBER` (acepta 5493364513355 o solo 3364513355).
 */
export const WHATSAPP_LOCAL_CONTACT_DIGITS = '3364513355';

const DEFAULT_WHATSAPP_E164 = `549${WHATSAPP_LOCAL_CONTACT_DIGITS}`;

function digitsOnlyPhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * Normaliza a E.164 sin + para wa.me (`549` + 10 dígitos = 13 en total para móvil AR).
 *
 * WhatsApp muestra errores tipo "+54 … no está en WhatsApp" si el link queda **truncado** (pasó con
 * `54933645133`: faltaban los dígitos `55` al pegar una variable mal). Si el valor es prefijo incompleto
 * del número canónico del estudio, se completa.
 */
function normalizeArgentinaWhatsappWaMeDigits(digits: string): string {
  const canonical = DEFAULT_WHATSAPP_E164;
  const okArgentinaMobileWaMe = /^549\d{10}$/;
  if (!digits) return canonical;
  if (okArgentinaMobileWaMe.test(digits)) return digits;
  /** 3364513355 → 5493364513355 */
  if (/^\d{10}$/.test(digits) && !digits.startsWith('54')) {
    return `549${digits}`;
  }
  /** Truncamiento al pegar ENV (54933645133 → completar hasta 5493364513355). Pedimos ≥11 dígitos por si coincide el prefijo. */
  if (
    canonical.startsWith(digits) &&
    digits.startsWith('549') &&
    digits.length >= 11 &&
    digits.length < canonical.length
  ) {
    return canonical;
  }
  return digits;
}

/** Formato de lectura acordado: +54 9 3364 51-3355 (mismos dígitos que wa.me/5493364513355). */
function formatWhatsappAriaLabel(e164digits: string): string {
  const d = normalizeArgentinaWhatsappWaMeDigits(e164digits);
  if (d.startsWith('549') && d.length === 13) {
    const after54 = d.slice(3); // 93364513355 — 9 + 10 dígitos locales
    const local = after54.slice(1); // 3364513355
    const a = local.slice(0, 4);
    const b = local.slice(4, 6);
    const c = local.slice(6);
    return `WhatsApp al estudio: +54 9 ${a} ${b}-${c}`;
  }
  return `WhatsApp: +${d}`;
}

/** Botón flotante: número vía NEXT_PUBLIC_WHATSAPP_NUMBER (solo dígitos, ej. 5493364513355 o 3364513355). */
export function WhatsAppButton() {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.trim() ||
    DEFAULT_WHATSAPP_E164;
  const phoneNumber = normalizeArgentinaWhatsappWaMeDigits(digitsOnlyPhone(raw));
  const message =
    process.env.NEXT_PUBLIC_WHATSAPP_PREFILL?.trim() || DEFAULT_PREFILL;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  const aria = formatWhatsappAriaLabel(phoneNumber);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        asChild
        size="lg"
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp-hover))] text-white p-0"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={aria}
          aria-label={aria}
        >
          <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
        </a>
      </Button>
    </div>
  );
}

/** Igual que el footer: no mostrar en rutas de administración. */
export function ConditionalWhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return <WhatsAppButton />;
}
