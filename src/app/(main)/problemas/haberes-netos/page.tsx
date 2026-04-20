import { ProblemPageLayout } from '@/components/problem-page-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cálculo de Haberes Netos en Planes de Ahorro',
  description: '¿La administradora calculó mal sus haberes netos? Reclame la diferencia. Asesoramiento legal para la correcta liquidación de su plan.',
};

export default function HaberesNetosPage() {
  return (
    <ProblemPageLayout title="Cálculo de Haberes Netos">
      <p>
        Los "Haberes Netos" o "Crédito Neto" representan el dinero que la administradora debe devolver a un suscriptor que ha renunciado o ha sido rescindido, una vez que el grupo finaliza. El cálculo de este monto es una de las principales fuentes de conflicto.
      </p>

      <h2 className='font-headline'>¿Cómo se deberían calcular los Haberes Netos?</h2>
      <p>
        La fórmula básica es simple: es la suma de todas las "cuotas puras" que usted pagó. Una "cuota pura" es el resultado de dividir el valor del vehículo (valor móvil) por la cantidad de cuotas del plan (generalmente 84 o 120).
      </p>
      <p>
        Lo más importante es que este monto debe ser actualizado. La jurisprudencia mayoritaria sostiene que el valor de las cuotas puras que usted pagó en el pasado debe ser actualizado al valor del vehículo al momento del cierre y liquidación del grupo. Esto protege su dinero de la inflación.
      </p>
      
      <h2 className='font-headline'>Prácticas Abusivas en el Cálculo</h2>
      <p>
        Las administradoras frecuentemente realizan prácticas para disminuir el monto a devolver:
      </p>
      <ul>
        <li><strong>No actualizan los montos:</strong> Devuelven el valor nominal de lo que se pagó, lo cual es irrisorio debido a la inflación.</li>
        <li><strong>Aplican descuentos indebidos:</strong> Descuentan gastos administrativos, seguros, o penalidades que no corresponden sobre el capital a devolver.</li>
        <li><strong>Utilizan un "valor móvil" incorrecto:</strong> Toman un valor del vehículo desactualizado o inferior al real para el cálculo final.</li>
        <li><strong>Diferimiento de la devolución:</strong> Retienen el dinero por un tiempo prolongado después de la liquidación del grupo, sin pagar intereses.</li>
      </ul>

      <h2 className='font-headline'>Nuestra Intervención</h2>
      <p>
        Ante un cálculo de haberes netos incorrecto, actuamos de la siguiente manera:
      </p>
      <ol>
        <li><strong>Auditoría del cálculo:</strong> Solicitamos formalmente a la administradora todos los detalles de la liquidación para verificar su corrección.</li>
        <li><strong>Reclamo por la diferencia:</strong> Intimamos el pago de la diferencia adeudada, incluyendo la correcta actualización e intereses.</li>
        <li><strong>Acción judicial de cobro:</strong> Si no hay respuesta favorable, presentamos una demanda judicial para que un juez ordene el pago correcto, más los daños y perjuicios ocasionados.</li>
      </ol>
      <p>
        El dinero que invirtió es suyo. Luchamos para que se lo devuelvan completo y debidamente actualizado, como lo establece la ley.
      </p>
    </ProblemPageLayout>
  );
}
