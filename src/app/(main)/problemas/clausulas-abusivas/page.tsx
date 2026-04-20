import { ProblemPageLayout } from '@/components/problem-page-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cláusulas Abusivas en Planes de Ahorro',
  description: 'Identificamos y demandamos la nulidad de cláusulas abusivas en su contrato de plan de ahorro. Proteja sus derechos como consumidor.',
};

export default function ClausulasAbusivasPage() {
  return (
    <ProblemPageLayout title="Cláusulas Abusivas">
      <p>
        Los contratos de plan de ahorro son "contratos de adhesión", lo que significa que el consumidor no tiene poder de negociación: simplemente acepta o rechaza los términos impuestos por la administradora. Esta desigualdad da lugar a la inclusión de "cláusulas abusivas".
      </p>
      <p>
        Una cláusula es abusiva cuando, en contra de la buena fe, causa un desequilibrio importante en los derechos y obligaciones de las partes en perjuicio del consumidor. La Ley de Defensa del Consumidor (N° 24.240) establece que estas cláusulas se tendrán por no escritas.
      </p>

      <h2 className='font-headline'>Ejemplos de Cláusulas Abusivas Comunes</h2>
      <p>En los planes de ahorro, las cláusulas abusivas más frecuentes son:</p>
      <ul>
        <li><strong>Ajustes unilaterales del precio del bien:</strong> Cláusulas que permiten a la administradora modificar unilateralmente el precio de lista del vehículo sin una justificación clara y objetiva, desbalanceando la relación contractual en perjuicio del consumidor.</li>
        <li><strong>Gastos de administración y sellados:</strong> Cláusulas que imponen cargos administrativos excesivos o cuyo concepto no está claro.</li>
        <li><strong>Seguros impuestos:</strong> Obligación de contratar seguros con compañías vinculadas a la administradora a precios superiores a los de mercado.</li>
        <li><strong>Penalidades por renuncia:</strong> Cláusulas que establecen multas desproporcionadas para los suscriptores que renuncian al plan.</li>
        <li><strong>Prórroga de jurisdicción:</strong> Cláusulas que obligan al consumidor a litigar en los tribunales del domicilio de la administradora, dificultando el acceso a la justicia.</li>
        <li><strong>Plazos de entrega ambiguos:</strong> Términos que permiten a la administradora demorar la entrega del vehículo sin consecuencias.</li>
      </ul>

      <h2 className='font-headline'>¿Cómo se combaten estas cláusulas?</h2>
      <p>
        Las cláusulas abusivas no se "anulan" automáticamente. Es necesario que un juez, a pedido del consumidor, las declare nulas en un caso concreto.
      </p>
      <p>Nuestra estrategia es:</p>
      <ol>
        <li><strong>Análisis del contrato:</strong> Realizamos un estudio detallado del contrato y de los anexos para identificar todas las cláusulas potencialmente abusivas.</li>
        <li><strong>Reclamo extrajudicial:</strong> Intimamos a la administradora para que se abstenga de aplicar la cláusula en cuestión.</li>
        <li><strong>Acción judicial:</strong> Presentamos una demanda solicitando al juez que declare la nulidad de la cláusula y, en su caso, ordene a la administradora a reintegrar los montos pagados en virtud de ella, con más los daños y perjuicios.</li>
      </ol>
      <p>
        La lucha contra las cláusulas abusivas es fundamental para reequilibrar la relación contractual y proteger al consumidor, la parte más débil del contrato.
      </p>
    </ProblemPageLayout>
  );
}
