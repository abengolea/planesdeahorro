import { ProblemPageLayout } from '@/components/problem-page-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Defensa en Ejecución Prendaria — Plan de Ahorro',
  description:
    '¿Recibió una intimación o enfrenta una ejecución prendaria? Actúe rápido. Le ofrecemos la mejor defensa para proteger su vehículo y sus derechos.',
};

export default function SecuestroPrendarioPage() {
  return (
    <ProblemPageLayout title="Ejecución Prendaria">
      <p>
        La ejecución prendaria es la acción judicial más agresiva que puede iniciar una administradora de plan de ahorro cuando un suscriptor que ya tiene el vehículo deja de pagar las cuotas. Suele incluir el secuestro del bien: el objetivo de la administradora es recuperar el auto para venderlo y saldar la deuda.
      </p>
      <p>
        Es un proceso muy rápido y, si no se actúa a tiempo, puede resultar en la pérdida de su vehículo en cuestión de semanas.
      </p>

      <h2 className='font-headline'>¿Cómo funciona el proceso?</h2>
      <ol>
        <li><strong>Mora en el pago:</strong> El suscriptor deja de pagar un número determinado de cuotas.</li>
        <li><strong>Intimación de pago:</strong> La administradora envía una carta documento intimando a pagar la deuda en un plazo corto.</li>
        <li><strong>Inicio de la acción judicial:</strong> Si no hay pago, la administradora presenta una demanda solicitando el secuestro del vehículo.</li>
        <li><strong>Orden de secuestro:</strong> El juez, sin escuchar al deudor, puede librar una orden para que un oficial de justicia, acompañado por la policía, secuestre el auto donde sea que se encuentre.</li>
        <li><strong>Subasta:</strong> Una vez secuestrado, el vehículo es subastado públicamente.</li>
      </ol>

      <h2 className='font-headline'>¡Usted tiene defensas!</h2>
      <p>
        Aunque el proceso es rápido, no significa que usted esté indefenso. Existen numerosas estrategias legales para frenar la ejecución o el secuestro y proteger sus derechos:
      </p>
      <ul>
        <li><strong>Nulidad de la intimación:</strong> Si la intimación de pago no cumple con los requisitos legales, todo el proceso posterior puede ser nulo.</li>
        <li><strong>Liquidación de deuda abusiva:</strong> A menudo, la deuda reclamada por la administradora es incorrecta, incluye intereses sobre intereses (anatocismo), gastos improcedentes o se basa en un cálculo de cuotas o capital cuestionable. Discutir el monto de la deuda es una defensa clave.</li>
        <li><strong>Impugnación del cálculo de la deuda:</strong> Se puede pedir al juez que revise cómo se armó el saldo reclamado; si el monto resulta inflado o mal liquidado, la mora o el propio reclamo de la administradora pueden verse afectados.</li>
        <li><strong>Ofrecimiento de pago:</strong> Presentarse en el juicio y ofrecer un plan de pagos razonable puede ser una vía para detener el secuestro y regularizar la situación.</li>
      </ul>

      <h2 className='font-headline'>La importancia de actuar rápido</h2>
      <p>
        Desde el momento en que recibe la primera intimación o una notificación del juzgado, el tiempo es crucial. Ponerse en contacto con un abogado especializado de inmediato puede marcar la diferencia entre conservar su vehículo y perderlo.
      </p>
    </ProblemPageLayout>
  );
}
