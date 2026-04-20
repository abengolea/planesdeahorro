import { ProblemPageLayout } from '@/components/problem-page-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rescisión de Contrato de Plan de Ahorro',
  description: '¿Quiere renunciar a su plan o la administradora lo rescindió? Conozca sus derechos y cómo recuperar su dinero. Asesoramiento legal experto.',
};

export default function RescisionPage() {
  return (
    <ProblemPageLayout title="Rescisión del Contrato">
      <p>
        La rescisión de un contrato de plan de ahorro puede ser una decisión del suscriptor (renuncia) o una medida tomada por la administradora (generalmente por falta de pago). En ambos casos, existen derechos y obligaciones que deben ser respetados.
      </p>

      <h2 className='font-headline'>Renuncia Voluntaria del Suscriptor</h2>
      <p>
        Usted tiene derecho a renunciar a su plan de ahorro en cualquier momento. Es fundamental comunicar esta decisión de forma fehaciente, usualmente mediante una carta documento, para que quede constancia.
      </p>
      <p>
        Al renunciar, usted no pierde el dinero invertido. Tiene derecho a que se le reintegre el valor de las "cuotas puras" abonadas. Sin embargo, este reintegro no es inmediato. La devolución se efectuará al finalizar la vida del grupo, y el monto será actualizado al valor del vehículo en ese momento.
      </p>

      <h2 className='font-headline'>Rescisión por parte de la Administradora</h2>
      <p>
        Si usted deja de pagar un número determinado de cuotas (usualmente 3 consecutivas o 4 alternadas), la administradora puede rescindir su contrato. Este acto también debe ser notificado.
      </p>
      <p>
        Al igual que en la renuncia, el contrato se extingue, pero usted conserva el derecho a la devolución de sus cuotas puras al final del plan. Las administradoras a menudo intentan aplicar multas o penalidades por esta rescisión, muchas de las cuales son consideradas abusivas y pueden ser impugnadas judicialmente.
      </p>
      
      <h2 className='font-headline'>Problemas Frecuentes y Cómo Actuamos</h2>
      <ul>
        <li><strong>Negativa a recibir la renuncia:</strong> Obligamos a la administradora a aceptar la renuncia mediante intimaciones legales.</li>
        <li><strong>Aplicación de penalidades excesivas:</strong> Cuestionamos judicialmente las multas y solicitamos su nulidad por ser cláusulas abusivas.</li>
        <li><strong>Falta de devolución de los fondos:</strong> Al finalizar el plan, si no se realiza la liquidación y el pago correspondiente, iniciamos acciones legales para el cobro de los haberes.</li>
      </ul>
      <p>
        Ya sea que quiera salirse de su plan o que la administradora lo haya dejado fuera, es crucial que se asesore para proteger el capital que invirtió.
      </p>
    </ProblemPageLayout>
  );
}
