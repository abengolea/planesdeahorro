import { ProblemPageLayout } from '@/components/problem-page-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Problemas con la Liquidación del Plan de Ahorro',
  description: 'Asesoramiento legal si su administradora demora o calcula mal la liquidación final de su plan de ahorro. Defendemos sus derechos.',
};

export default function LiquidacionPage() {
  return (
    <ProblemPageLayout title="Liquidación del Plan de Ahorro">
      <p>
        La etapa de liquidación de un plan de ahorro ocurre al finalizar el plazo del grupo. Es el momento en que la administradora debe rendir cuentas y, en muchos casos, devolver dinero a los suscriptores. Sin embargo, esta etapa está llena de potenciales conflictos.
      </p>
      
      <h2 className='font-headline'>Problemas Comunes en la Liquidación</h2>
      <ul>
        <li><strong>Demoras injustificadas:</strong> Las administradoras suelen tardar meses o incluso años en realizar la liquidación final y poner los fondos a disposición de los ahorristas.</li>
        <li><strong>Cálculos incorrectos:</strong> A menudo, se aplican descuentos indebidos, no se actualizan correctamente los montos o se realizan liquidaciones a valores inferiores a los que corresponden.</li>
        <li><strong>Falta de información:</strong> El ahorrista se encuentra con una total falta de transparencia sobre cómo se calculó el monto a devolver.</li>
        <li><strong>Cobro de multas o penalidades improcedentes:</strong> Se aplican penalidades por rescisión que no corresponden o que son excesivas.</li>
      </ul>

      <h2 className='font-headline'>¿Quiénes tienen derecho a la devolución de fondos?</h2>
      <p>
        Principalmente, los suscriptores que renunciaron al plan, los que fueron rescindidos por falta de pago y, en algunos casos, los que pagaron la totalidad del plan pero nunca retiraron el vehículo. A estos ahorristas se les debe devolver el valor de las "cuotas puras" que pagaron, actualizado al valor del vehículo al momento de la liquidación.
      </p>

      <h2 className='font-headline'>Nuestra Estrategia Legal</h2>
      <p>
        Nuestro enfoque se basa en una acción legal rápida y efectiva:
      </p>
      <ol>
        <li><strong>Intimación por carta documento:</strong> Exigimos formalmente a la administradora la correcta liquidación y el pago inmediato de los haberes.</li>
        <li><strong>Mediación y audiencias de conciliación:</strong> Buscamos un acuerdo favorable en la etapa prejudicial para evitar un juicio largo.</li>
        <li><strong>Demanda judicial:</strong> Si la administradora no cumple, iniciamos una demanda por cumplimiento de contrato, daños y perjuicios, y aplicamos multas (daño punitivo) por la conducta abusiva.</li>
      </ol>
      <p>
        No permita que la administradora se quede con su dinero. La ley de defensa del consumidor lo ampara y nosotros sabemos cómo hacerla cumplir.
      </p>
    </ProblemPageLayout>
  );
}
