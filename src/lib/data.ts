import type { Article, FAQ, FaqSection, FrequentProblem } from './types';

export const frequentProblems: FrequentProblem[] = [
  {
    slug: 'liquidacion',
    title: 'Liquidación del Plan',
    description: 'Problemas y demoras al finalizar su plan y solicitar la liquidación de haberes.',
  },
  {
    slug: 'rescision',
    title: 'Rescisión de Contrato',
    description: 'Conflictos derivados de la rescisión anticipada del contrato por parte del suscriptor o la administradora.',
  },
  {
    slug: 'haberes-netos',
    title: 'Cálculo de Haberes Netos',
    description: 'Discrepancias en el cálculo de los haberes netos y los montos a reintegrar por la administradora.',
  },
  {
    slug: 'secuestro-prendario',
    title: 'Secuestro Prendario',
    description: 'Defensa ante acciones de secuestro del vehículo por falta de pago de cuotas.',
  },
  {
    slug: 'clausulas-abusivas',
    title: 'Cláusulas Abusivas',
    description: 'Análisis y nulidad de cláusulas que imponen condiciones desproporcionadas en el contrato.',
  },
];

export const doctrinalArticles: Article[] = [
  {
    slug: 'la-naturaleza-juridica-del-plan-de-ahorro',
    title: 'La Naturaleza Jurídica del Contrato de Plan de Ahorro',
    summary:
      'Un análisis profundo sobre si el plan de ahorro es un contrato de consumo, un mandato, o una figura mixta. Implicancias prácticas de cada postura.',
    author: 'Dr. Juan Pérez',
    date: '2024-03-10',
    content: 'Análisis detallado sobre la naturaleza jurídica del contrato de plan de ahorro...',
  },
  {
    slug: 'el-valor-movil-y-la-crisis-economica',
    title: 'El "Valor Móvil" en Jaque: Cómo la Crisis Económica Desnaturaliza el Contrato',
    summary:
      'Exploración de la teoría de la imprevisión y el esfuerzo compartido como herramientas legales para morigerar los efectos de la devaluación en los planes de ahorro.',
    author: 'Dra. Ana Gómez',
    date: '2024-02-05',
    content: 'Artículo completo sobre la crisis económica y su impacto en el valor móvil...',
  },
  {
    slug: 'defensa-del-consumidor-en-secuestro-prendario',
    title: 'Estrategias de Defensa del Consumidor ante un Secuestro Prendario',
    summary:
      'Guía práctica con las principales defensas y nulidades que pueden oponerse en un juicio de secuestro prendario iniciado por una administradora de plan de ahorro.',
    author: 'Dr. Carlos Rodríguez',
    date: '2024-01-20',
    content: 'Guía detallada sobre cómo defenderse en un juicio de secuestro prendario...',
  },
];

/** FAQ por tema: texto divulgativo para lectores sin formación jurídica. */
export const faqSections: FaqSection[] = [
  {
    id: 'contratacion',
    title: 'Antes de firmar',
    description:
      'Qué mirar en el contrato y los papeles que te dan, si algo no coincide con lo prometido, y qué es ese cargo de “entrada” al plan.',
    items: [
      {
        question: 'Voy a firmar un plan de ahorro, ¿qué tengo que mirar con lupa?',
        answer:
          'Ojo con los anexos y letras chicas: ahí suelen estar condiciones que en la oferta no te dijeron al oído.\n\nPedí siempre copia de todo lo que firmás. Si te prometieron algo “especial”, pedí que te lo manden por mail o carta; lo que queda solo de palabra después es difícil de probar.\n\nEn el seguro de vida que te hacen firmar conviene aclarar quién es el beneficiario (por ejemplo cónyuge o hijos) y guardar una copia.',
      },
      {
        question: 'Me vendieron el plan con datos que no eran ciertos, ¿qué puedo hacer?',
        answer:
          'Si lo contrataste por teléfono o por internet, suele existir un plazo para arrepentirte: hay que avisar a la administradora con una notificación que deje constancia (por ejemplo carta documento o el medio que indique la ley).\n\nEn otros casos se puede plantear que el contrato no vale o debe ajustarse porque te mintieron o te ocultaron datos importantes; eso lo mira un abogado con los papeles que tengas.\n\nNo dejes pasar tiempo: cuanto antes consultes, mejor.',
        highlight: true,
      },
      {
        question: '¿Tengo derecho a llevarme copia de todo lo que firmo?',
        answer:
          'Sí, sí y sí. Sin tus copias es muy difícil reclamar después.\n\nLo mismo si te hicieron “una promesa” aparte del contrato: que te la manden por escrito. Muchos problemas vienen de ofertas que nunca quedaron en un papel.',
      },
      {
        question: '¿Qué es el derecho de admisión?',
        answer:
          'Es como un cargo de “entrada” al sistema de sorteos y adjudicaciones: en muchos planes ronda el 3 % del valor del auto, pero depende de lo que diga tu contrato.\n\nA veces lo prorratean en muchas cuotas chicas para que no se “sienta” tanto; si al final del plan faltan cuotas de eso, suelen descontarlo de lo que te corresponde cobrar.\n\nHay quienes sostienen que es un cobro cuestionable; si te pasa algo raro, conviene asesoramiento.',
      },
    ],
  },
  {
    id: 'entrega',
    title: 'Entrega del auto',
    description:
      'Plazos, seguros, qué te pueden cobrar al retirar el vehículo y cómo reclamar si tardan demasiado.',
    items: [
      {
        question: 'Adjudicaron el auto, ¿cuánto pueden tardar en entregarlo?',
        answer:
          'El plazo lo fija tu contrato; en muchos casos suele hablarse de unos 60 días desde que se completan ciertos pasos (pedido de unidad, papeles, etc.). Leé bien la cláusula.\n\nSi se pasan de ese plazo, el contrato suele prever una indemnización por día de demora. Eso no quita que, si tenés otros daños comprobables, también puedan reclamarse: eso lo ve un abogado con tu caso.',
        highlight: true,
      },
      {
        question: '¿Desde qué día empiezo a contar los días de entrega?',
        answer:
          'Depende de cómo esté escrito tu contrato. Lo habitual es que arranque cuando pediste la unidad y presentaste en concesionaria la documentación que te pidieron.\n\nPedí siempre un comprobante (recibo, remito o similar) de que entregaste los papeles o pediste el vehículo. Sin eso, después es muy difícil saber “día cero” y las empresas suelen discutirlo.',
      },
      {
        question: 'Si cambio de modelo, ¿automáticamente me alargan el plazo?',
        answer:
          'No debería alargarse solo por el pedido de cambio: la empresa tendría que fundar por qué necesita más tiempo.\n\nSi ya se venció el plazo original y siguen sin entregar, podés reclamar conforme al contrato y a la ley.',
      },
      {
        question: '¿Puedo elegir el seguro del auto adjudicado?',
        answer:
          'Las reglas de planes de ahorro suelen obligar a la concesionaria a ofrecerte varias compañías para que elijas.\n\nSi te obligan a una sola o el seguro sale mucho más caro que en el mercado, podés averiguar si eso es correcto y, si no, reclamar la diferencia que pagaste de más.',
      },
      {
        question: 'Tardaron en entregar, ¿cómo reclamo la indemnización?',
        answer:
          'Anotá las fechas: cuándo se cumplió el plazo del contrato y cuándo retiraste realmente el auto.\n\nAl firmar el remito de entrega, podés escribir a mano que no estás conforme y que reservás el derecho a reclamar la demora (tu abogado te puede sugerir la redacción exacta).\n\nDespués, carta documento o reclamo a administradora y concesionaria. Si no respondieron, mediación, defensa del consumidor o demanda, según el caso.',
      },
      {
        question: 'Al sacar el auto, ¿qué me pueden cobrar y qué no?',
        answer:
          'En general solo conceptos como flete de entrega, patentamiento, inscripción de prenda si corresponde y seguro de traslado —lo que digan la ley y tu contrato.\n\nSi te suman cargos raros o montos enormes, pedí detalle por escrito y compará con la carta o liquidación que te mandó la administradora; si no cierra, reclamá.',
      },
      {
        question: 'Me quieren cobrar muy caro la “entrega”, ¿cómo lo controlo?',
        answer:
          'La administradora suele mandarte por correo los montos aproximados de gastos de entrega; deberían ser parecidos a lo que te cobra la concesionaria.\n\nSi pagaste de más para no quedarte sin el auto, guardá comprobantes: después podés pedir que te devuelvan la diferencia indebida.',
      },
    ],
  },
  {
    id: 'aumentos',
    title: 'Cuotas y aumentos',
    description:
      'Por qué no existe la “cuota fija” de por vida, qué hacer si suben fuerte, remates y secuestro del vehículo.',
    items: [
      {
        question: '¿Existe la “cuota fija” en los planes de ahorro?',
        answer:
          'En la práctica, no: la cuota se actualiza según el valor del auto de referencia, así que sube (o varía) con el tiempo.\n\nSi alguien te promete una cuota “fija para siempre”, desconfiá y pedí el detalle por escrito: sin eso, después es difícil reclamar.',
        highlight: true,
      },
      {
        question: '¿Qué es el “valor móvil” del auto?',
        answer:
          'Es el precio de referencia del 0 km que usa el plan para armar la cuota pura. Ese precio sube y baja con el mercado, por eso la cuota no puede quedar “congelada” para siempre.',
      },
      {
        question: 'Me subieron mucho las cuotas, ¿qué hago?',
        answer:
          'Revisá si el aumento encaja con lo firmado y con las reglas del plan (valor del vehículo, cargos permitidos, etc.).\n\nSi entraste hace poco y te explotó el monto sin explicación clara, actuá rápido: abogado o defensa del consumidor de tu ciudad.\n\nCuando hubo devaluaciones fuertes, el tema se volvió muy discutido; cada caso es distinto.',
      },
      {
        question: '¿Me pueden sacar el auto si debo cuotas? (secuestro)',
        answer:
          'Si el auto está prendado, la administradora puede ir a la justicia para cobrar lo adeudado y pedir medidas sobre el vehículo. El juez mira cuánto debés, si estás pagando o negociando, y otras circunstancias.\n\nSi debés pocas cuotas o estás mostrando buena voluntad de pago, a veces se considera desmedido apurar el secuestro: eso se debate en cada juicio.',
      },
      {
        question: 'Remataron el auto por deuda, ¿qué tengo que revisar?',
        answer:
          'Revisá que el dinero del remate se use bien: gastos del remate, deuda y, si sobra algo, que te lo devuelvan según corresponda.\n\nOjo con la transferencia: el auto no puede quedar a tu nombre si ya no es tuyo; eso te puede traer multas, patentes o problemas de tránsito que no te corresponden.',
      },
    ],
  },
  {
    id: 'mora',
    title: 'Si no podés pagar o dejaste de pagar',
    description:
      'Qué pasa con el auto, si te exigen “toda la deuda de golpe” y qué puede tocarte cobrar cuando termina el grupo.',
    items: [
      {
        question: 'Ya tengo el auto y dejo de pagar: ¿qué me puede pasar?',
        answer:
          'Entrás en mora: te pueden cargar intereses por atraso y, además, la empresa puede iniciar juicio para cobrar lo que debés, incluso pidiendo afectar el vehículo en garantía.\n\nQué conviene hacer (pago, acuerdo, defensa) depende de cuánto debés, cómo venías pagando y si hay algo irregular en lo que te cobran.',
        highlight: true,
      },
      {
        question: '¿Me pueden pedir todas las cuotas de una por atrasarme un poco?',
        answer:
          'Muchos contratos dicen que si te atrasás, se caen todas las cuotas juntas. Eso se ha cuestionado como abusivo: a veces se defiende que podés poner al día lo adeudado más intereses sin tumbar todo el plan.\n\nLos jueces no siempre responden igual; por eso importa mirar el contrato con un abogado.',
      },
      {
        question: 'Cambiaron el modelo de auto de referencia, ¿me pueden subir la cuota así nomás?',
        answer:
          'Si la empresa cambia el “auto tipo”, suele tener que avisarte bien y que vos lo aceptes. Si no lo hicieron como manda la ley y el contrato, el aumento puede impugnarse.\n\nEn casos graves hasta puede hablarse de rescisión con devolución y daños; eso es caso por caso.',
      },
      {
        question: 'Dejé de pagar: ¿alguna vez recupero plata?',
        answer:
          'Si pagaste más de tres cuotas, en muchos esquemas te corresponde algo al terminar el grupo (a veces después de varios años de espera).\n\nLo que devuelven suele calcularse con el valor de la cuota pura al momento del pago (no lo que pagabas hace años), menos una penalidad que en la práctica suele rondar el 2 % o lo que diga el plan.\n\nTiene que avisarte la empresa y ponerte el dinero a disposición; si no, pueden corresponder intereses. Los números exactos salen de tu contrato y del grupo.',
      },
    ],
  },
  {
    id: 'liquidacion',
    title: 'Liquidación: cuando termina el plan',
    description:
      'Qué te pueden descontar del “haber”, por qué a veces cobrás menos de lo esperado, liquidaciones complementarias e intereses si se demoran.',
    items: [
      {
        question: '¿Qué me pueden descontar cuando me liquidan el plan?',
        answer:
          'La Inspección General de Justicia (IGJ) y las resoluciones que rijan tu plan ponen límites: solo ciertos conceptos, como cargas administrativas en situaciones de falta de pago prolongada o según el caso, partes del seguro de vida bajo condiciones puntuales, etc.\n\nOtras deducciones (por ejemplo bonificaciones atadas a adjudicarte el auto) están muy discutidas. Pedí siempre liquidación en detalle y, si algo no entendés, llevá los papeles a un abogado.',
        highlight: true,
      },
      {
        question: '¿Por qué me pagan menos “haber neto” del que esperaba?',
        answer:
          'A veces las empresas reparten entre todos los integrantes del grupo parte de lo que no pudieron cobrarle a otros morosos. Eso choca con la idea de proteger al consumidor, pero sucede.\n\nMás adelante pueden aparecer “liquidaciones complementarias” cuando recuperan plata de deudores: conviene fijarse que los montos estén actualizados y con intereses razonables.',
      },
      {
        question: '¿Qué son las liquidaciones complementarias?',
        answer:
          'Son pagos extra cuando el grupo cobra dinero de alguien que sacó el auto y no pagó el préstamo prendario, por ejemplo.\n\nDeberían calcularse con el valor del auto actualizado y con criterios de interés acordes. Si te llegó poco o desactualizado, podés reclamar.',
      },
      {
        question: '¿Por qué me restan el derecho de admisión o cuotas prorrateadas?',
        answer:
          'Si firmaste pagar eso en muchas cuotas y quedaron sin pagar, el contrato suele decir que lo descuentan de lo que te toca al final.\n\nHay defensores del consumidor que cuestionan todo el mecanismo; si te parece injusto, juntá copia de lo firmado y consultá.',
      },
      {
        question: 'No me mandaron la liquidación final, ¿qué hago?',
        answer:
          'Mandales un reclamo por escrito pidiendo la liquidación completa y los comprobantes. Tenés derecho a saber en qué se basaron los números.\n\nSi no contestan, defensa del consumidor o vía judicial, con copia de lo que pediste.',
      },
      {
        question: 'Si demoran en darme la plata de la liquidación, ¿hay intereses?',
        answer:
          'Sí: las reglas vigentes prevén intereses cuando no ponen los fondos a tu disposición como corresponde. Cuánto y cómo se calcula depende de la resolución que aplique a tu grupo y de las fechas concretas.',
      },
      {
        question: '¿Puedo renunciar al plan?',
        answer:
          'Sí. Dejá constancia por escrito lo antes posible (carta documento, mail con acuse o lo que te sirva como prueba).\n\nCorresponde, al cierre del grupo, el reintegro de lo que aporte la cuota pura, menos lo que autorice el contrato (penalidad, cargos, etc.). Si la empresa no cumple o se demora, podés reclamar por vías administrativas o judiciales.',
      },
      {
        question: 'Ya pagué todo el plan: ¿cuándo me devuelven la plata?',
        answer:
          'La administradora debe liquidar el grupo y avisarte para cobrar lo que te corresponda si no adjudicaste o rescindiste, dentro de los plazos y formas que rijan tu plan.\n\nSi se demoran, suman cargos dudosos o los números no cierran, conviene un reclamo por escrito; si no alcanza, valen las vías de defensa del consumidor o la justicia con asesoramiento.',
      },
    ],
  },
  {
    id: 'fondos',
    title: 'Fondo de multas y remanentes',
    description:
      'Plata que queda en el grupo por penalidades o sobrantes: de quién es y cómo enterarte a tiempo.',
    items: [
      {
        question: '¿Qué es el fondo de multas?',
        answer:
          'Es un monto que se arma con las penalidades que cobran a quienes renuncian o rescinden el plan (suele ser un porcentaje sobre la liquidación, según cada grupo).\n\nSe ha criticado que lo repartan solo entre adjudicados y dejen afuera a quienes cumplieron pero no sacaron auto: si te pasa algo así, se puede discutir.',
      },
      {
        question: '¿A mí me toca cobrar del fondo de multas?',
        answer:
          'Depende de las reglas del grupo y de cómo cerraron la cuenta. Si la forma de reparto te parece injusta, consultá con un abogado.\n\nMuchas veces no te avisan por carta: llamá o escribí a administradora o concesionaria cuando se liquida el grupo.',
      },
      {
        question: 'No me pagaron del fondo de multas, ¿qué hago?',
        answer:
          'Mandá un reclamo formal pidiendo liquidación y el pago que te corresponda. Si no te dan bola, mediación o demanda.\n\nJuntá lo que tengas del cierre del grupo y todo intercambio de mails o cartas.',
      },
      {
        question: '¿Qué son los remanentes y cómo me entero?',
        answer:
          'Son sobrantes de dinero en el grupo después de pagar a los ahorristas y las deudas previstas; en principio deberían repartirse entre los socios según el plan.\n\nLas empresas a veces lo publican en diarios (edictos) y es fácil perderse la novedad: al acercarse el fin del grupo, preguntá de forma activa si hay plata a repartir.',
      },
    ],
  },
  {
    id: 'estudio',
    title: 'Consultá con el estudio',
    description: 'Solo sobre cómo trabaja el estudio: la consulta inicial sin cargo y qué podés esperar.',
    items: [
      {
        question: '¿La primera consulta tiene costo?',
        answer:
          'No. La primera evaluación de tu caso es gratuita y sin compromiso. Ahí entendemos tu situación, te orientamos si podemos intervenir y, si encaja, te explicamos cómo serían los honorarios para las etapas siguientes.\n\nLas dudas sobre cómo funciona el plan de ahorro en general están repartidas en las secciones de arriba; esta parte es solo el canal con el estudio.',
        highlight: true,
      },
    ],
  },
];

/** Lista plana (orden de aparición en `faqSections`). */
export const faqs: FAQ[] = faqSections.flatMap((s) => s.items);

/** Ítems marcados para la home (máx. 4 recomendados). */
export const faqHomeItems: FAQ[] = faqs.filter((f) => f.highlight).slice(0, 4);
