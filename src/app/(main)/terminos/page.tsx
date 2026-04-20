import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso',
  description:
    'Condiciones generales de uso de este sitio (Adrián Bengolea – Reclamos por planes de ahorro): alcance informativo, limitaciones de responsabilidad y normas aplicables en la República Argentina.',
};

const lastUpdated = '19 de abril de 2026';

export default function TerminosPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-muted-foreground">Última actualización: {lastUpdated}</p>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mt-2">
            Términos y Condiciones de Uso
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Al acceder y utilizar este sitio web, usted acepta estos términos. Si no está de acuerdo, le solicitamos
            que no utilice el sitio.
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none mt-10">
            <h2 className="font-headline text-xl md:text-2xl text-foreground">1. Titular del sitio</h2>
            <p>
              El sitio web <strong>Adrián Bengolea – Reclamos por planes de ahorro</strong> es operado con fines
              profesionales y de información por el Dr. Adrián Bengolea, abogado matriculado en la Provincia de Buenos
              Aires, República Argentina. En adelante,
              &quot;nosotros&quot; o &quot;el
              titular&quot; se refieren a quien administra el sitio en representación de dicho estudio o actividad
              profesional.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">2. Objeto y naturaleza del contenido</h2>
            <p>
              El sitio tiene por objeto difundir información general sobre conflictos vinculados a planes de ahorro,
              derecho del consumidor y temas afines, y facilitar canales de contacto o herramientas de evaluación
              preliminar. La información publicada es de carácter orientativo y educativo, salvo que se indique
              expresamente otra cosa.
            </p>
            <p>
              <strong>
                Nada de lo publicado en este sitio sustituye el asesoramiento legal personalizado ni constituye por sí
                mismo una opinión jurídica vinculante.
              </strong>{' '}
              Cada situación particular requiere análisis concreto de hechos, documentación y normativa aplicable al
              momento del caso.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">3. Uso permitido del sitio</h2>
            <p>Usted se compromete a utilizar el sitio de manera lícita y de buena fe, en particular a:</p>
            <ul>
              <li>No emplear el sitio para fines ilícitos, fraudulentos o que vulneren derechos de terceros.</li>
              <li>No intentar acceder sin autorización a sistemas, cuentas o áreas restringidas.</li>
              <li>No sobrecargar, interferir o dañar el funcionamiento del sitio o de sus integraciones.</li>
              <li>No reproducir masivamente contenidos sin consentimiento cuando la ley o el titular lo exijan.</li>
            </ul>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">4. Herramientas de evaluación y asistencia automatizada</h2>
            <p>
              Si el sitio ofrece formularios, chats u otras herramientas (incluidas las basadas en inteligencia
              artificial) para orientar o registrar una consulta, dichas funciones tienen carácter{' '}
              <strong>preliminar e informativo</strong>. Las respuestas generadas de forma automática pueden contener
              imprecisiones o no reflejar la totalidad de su situación.
            </p>
            <p>
              La evaluación definitiva de un caso, la estrategia procesal o extrajudicial y los plazos aplicables solo
              pueden determinarse en el marco de una relación profesional concreta, con revisión humana de la
              documentación y los hechos.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">5. Propiedad intelectual</h2>
            <p>
              Los textos, diseño, logotipos, marcas, imágenes y demás elementos del sitio están protegidos por la
              legislación argentina e internacional en materia de propiedad intelectual, salvo mención expresa de
              materiales de terceros. Queda prohibida su reproducción o explotación sin autorización previa, salvo los
              usos permitidos por la ley (por ejemplo, cita breve con mención de fuente cuando corresponda).
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">6. Enlaces y sitios de terceros</h2>
            <p>
              El sitio puede incluir enlaces a páginas externas. Esos enlaces se ofrecen solo para comodidad del usuario.
              No controlamos ni somos responsables del contenido, políticas de privacidad ni prácticas de sitios
              terceros. El acceso a ellos es bajo su propio riesgo.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">7. Limitación de responsabilidad</h2>
            <p>
              En la medida en que la normativa aplicable lo permita, el titular no será responsable por daños directos o
              indirectos derivados del uso o la imposibilidad de uso del sitio, ni por decisiones adoptadas exclusivamente
              con base en la información general aquí publicada o en respuestas automatizadas, sin contrato profesional
              específico.
            </p>
            <p>
              El sitio se ofrece &quot;tal cual&quot;; no garantizamos disponibilidad ininterrumpida ni ausencia total de
              errores técnicos o editoriales, aunque procuramos mantenerlos actualizados y operativos.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">8. Datos personales</h2>
            <p>
              El tratamiento de datos personales que se realice a través del sitio se rige por lo dispuesto en la{' '}
              <Link href="/privacidad" className="text-primary underline underline-offset-4 hover:no-underline">
                Política de Privacidad
              </Link>
              , que forma parte integrante de estas condiciones en lo que respecta a privacidad.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">9. Relación profesional y honorarios</h2>
            <p>
              El mero uso del sitio o el envío de un mensaje no crea por sí solo mandato ni contrato de prestación de
              servicios jurídicos. Los honorarios, alcance del encargo y forma de trabajo se acordarán por escrito o por
              los medios que la práctica profesional considere adecuados, de conformidad con la normativa aplicable al
              ejercicio de la abogacía.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">10. Modificaciones</h2>
            <p>
              Podemos actualizar estos Términos y Condiciones en cualquier momento. La versión vigente se publicará en
              esta página con su fecha de última actualización. El uso continuado del sitio después de los cambios
              implica la aceptación de los mismos, salvo disposición legal en contrario.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">11. Ley aplicable y jurisdicción</h2>
            <p>
              Estos términos se interpretan según las leyes de la <strong>República Argentina</strong>. Para cualquier
              controversia derivada del acceso o uso del sitio, salvo normas imperativas que dispongan otro fuero, los
              usuarios se someten a los tribunales ordinarios con competencia en la ciudad de residencia del titular o,
              en su caso, a los que resulten competentes según la legislación procesal vigente.
            </p>

            <h2 className="font-headline text-xl md:text-2xl text-foreground mt-10">12. Contacto</h2>
            <p>
              Para consultas sobre estos términos o sobre el uso del sitio, puede utilizar los medios de contacto
              indicados en la web (por ejemplo, la sección correspondiente o los canales habilitados en el sitio).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
