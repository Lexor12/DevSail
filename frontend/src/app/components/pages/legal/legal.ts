import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

//Este documento muestra: Avisos legale aviso de privacidad, términos y condiciones y reglas de publicación
// Se abren desde el pie de página en /legal/privacy, /legal/terms y /legal/rules

// Cada bloque es un párrafo (texto) o una lista (arreglo de textos)
type LegalBlock = string | string[];

interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

interface LegalDocument {
  title: string;
  version: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
}

type LegalPage = 'privacy' | 'terms' | 'rules';

// Datos del responsable, en un solo lugar para no repetirlos
const COMPANY = 'DevSail';
const RFC = 'DSA261101AB1';
const ADDRESS = 'Av. Siempre Viva 742, Zapopan, Jalisco, México';
const PHONE = '33 1234 5678';
const EMAIL = 'contactodevsail@gmail.com';

const DOCUMENTS: Record<LegalPage, LegalDocument> = {
  privacy: {
    title: 'Aviso de privacidad',
    version: '1.0',
    updated: '25 de noviembre de 2026',
    intro: [
      `En ${COMPANY} protegemos tus datos personales. Este aviso te explica de forma clara qué datos recopilamos, para qué los usamos, con quién los compartimos y cómo puedes ejercer tus derechos como titular, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.`
    ],
    sections: [
      {
        heading: '1. ¿Quién recopila tus datos y quién es el responsable?',
        blocks: [
          'El responsable de recopilar, guardar y usar tus datos personales es:',
          [
            `Nombre comercial: ${COMPANY}`,
            `RFC: ${RFC}`,
            `Domicilio: ${ADDRESS}`,
            `Teléfono: ${PHONE}`,
            `Correo electrónico: ${EMAIL}`
          ]
        ]
      },
      {
        heading: '2. ¿Qué datos personales recopilamos?',
        blocks: [
          'Solo pedimos los datos necesarios para que la plataforma funcione:',
          [
            'Datos de identificación y contacto: nombre completo, nombre de usuario y correo electrónico.',
            'Datos de autenticación: contraseña, que se guarda cifrada y nadie puede leer.',
            'Datos de perfil (opcionales): foto, biografía y enlaces a LinkedIn, sitio personal, GitHub, GitLab, Bitbucket, Instagram y YouTube.',
            'Contenido que publicas: proyectos con sus imágenes, enlaces a repositorios y demostraciones, calificaciones, comentarios y reportes.',
            'Datos de pagos: número de orden de PayPal, concepto, monto, fecha y estado del pago.',
            'Datos técnicos: una cookie de sesión y la aceptación de este aviso y de los términos, con su versión y fecha.'
          ],
          `${COMPANY} no recopila ni guarda números de tarjeta ni datos bancarios: los pagos se hacen directamente en PayPal. Tampoco pedimos datos personales sensibles, como salud, religión u origen étnico.`
        ]
      },
      {
        heading: '3. ¿Qué datos son públicos?',
        blocks: [
          'La plataforma es una vitrina de proyectos, por lo que cualquier persona, aunque no tenga cuenta, puede ver: tu nombre completo, tu nombre de usuario, tu foto, tu biografía, los enlaces de tu perfil, tus proyectos publicados y tus calificaciones con comentario.',
          'Tu correo electrónico, tu contraseña y tus pagos nunca se muestran en el sitio.'
        ]
      },
      {
        heading: '4. ¿Para qué usamos tus datos?',
        blocks: [
          'Finalidades necesarias para darte el servicio:',
          [
            'Crear, proteger y administrar tu cuenta, incluida la verificación de tu correo con un código.',
            'Mostrar tu perfil y tus proyectos, y permitir que otras personas los califiquen, comenten, guarden y reporten.',
            'Procesar los pagos del Plan Pro y de los proyectos destacados, y enviarte el comprobante por correo.',
            'Enviarte avisos sobre tu cuenta: recuperación de contraseña, moderación de tu contenido y eliminación de la cuenta.',
            'Mostrarte estadísticas de visitas de tus proyectos si tienes Plan Pro.',
            'Atender reportes, aclaraciones y solicitudes de derechos ARCO.'
          ],
          'No usamos tus datos para publicidad, mercadotecnia ni fines distintos a los anteriores.'
        ]
      },
      {
        heading: '5. ¿Con quién compartimos tus datos?',
        blocks: [
          'Solo compartimos lo estrictamente necesario con los proveedores que hacen funcionar la plataforma:',
          [
            'PayPal: procesa los pagos en línea.',
            'Supabase: guarda la base de datos y las imágenes de perfiles y proyectos.',
            'Google (Gmail): envía los correos de verificación, comprobantes y avisos.',
            'Render y Netlify: hospedan el servidor y el sitio web.',
            'Shields.io: genera la insignia para el README y solo recibe datos públicos del proyecto.',
            'GitHub, GitLab y Bitbucket: solo reciben el enlace del repositorio para comprobar que exista y sea público.'
          ],
          `${COMPANY} no vende, renta ni comparte tus datos con terceros para publicidad o prospección comercial.`
        ]
      },
      {
        heading: '6. Cookies y visitas',
        blocks: [
          'Usamos una sola cookie, necesaria para mantener tu sesión iniciada hasta por 8 horas. No usamos cookies de publicidad ni de rastreo.',
          'Las visitas a los proyectos se cuentan por día de forma anónima: no guardamos quién visitó ni su dirección IP.'
        ]
      },
      {
        heading: '7. ¿Cuánto tiempo guardamos tus datos?',
        blocks: [
          'Mientras tu cuenta exista. Al eliminarla se borran tu perfil, tus proyectos con sus imágenes, tus calificaciones, tus comentarios y tus guardados.',
          'Los registros de pagos y de reportes se conservan sin tus datos personales, porque son el respaldo contable y de moderación de la plataforma. Los códigos de verificación vencen a los 15 minutos.'
        ]
      },
      {
        heading: '8. ¿Cómo puedes ejercer tus derechos ARCO?',
        blocks: [
          'Como titular de tus datos tienes estos derechos:',
          [
            'Acceso (A): conocer qué datos tenemos de ti y para qué los usamos.',
            'Rectificación (R): corregir tus datos si son inexactos o están incompletos.',
            'Cancelación (C): pedir que borremos tus datos.',
            'Oposición (O): oponerte a que usemos tus datos para un fin específico.'
          ],
          'Puedes hacerlo tú mismo desde el sitio: en Mi cuenta › Mis datos y seguridad consultas y corriges tus datos, y en Mi cuenta › Eliminar cuenta borras tu cuenta.',
          'También puedes enviar tu solicitud por:',
          [
            `Correo electrónico: ${EMAIL}`,
            `Teléfono: ${PHONE}`,
            `Domicilio: ${ADDRESS}`
          ],
          'Tu solicitud debe incluir tu nombre completo, el correo con el que te registraste y la descripción de los datos y del derecho que quieres ejercer. Te responderemos en el plazo que establece la ley vigente.'
        ]
      },
      {
        heading: '9. Revocación del consentimiento',
        blocks: [
          'Puedes retirar tu consentimiento para el uso de tus datos en cualquier momento eliminando tu cuenta o escribiendo a nuestro correo. Si lo retiras, ya no podremos darte el servicio.'
        ]
      },
      {
        heading: '10. Menores de edad',
        blocks: [
          `${COMPANY} está dirigido a personas mayores de 18 años. No recopilamos a sabiendas datos de menores de edad.`
        ]
      },
      {
        heading: '11. Cambios al aviso de privacidad',
        blocks: [
          'Podemos actualizar este aviso por cambios en la ley o en la plataforma. La versión vigente siempre estará en esta página con su fecha de actualización, y si el cambio es importante te pediremos aceptarlo de nuevo.'
        ]
      }
    ]
  },
  terms: {
    title: 'Términos y condiciones',
    version: '1.0',
    updated: '25 de noviembre de 2026',
    intro: [
      `Estos Términos y Condiciones regulan el uso de la plataforma ${COMPANY} (en adelante, "el sitio") y la contratación de sus servicios de pago. Al marcar la casilla de aceptación al registrarte y crear tu cuenta, declaras que los leíste, que los entiendes y que estás de acuerdo con ellos. Esta aceptación es un contrato entre tú y ${COMPANY}. Si no estás de acuerdo, no debes registrarte ni usar el sitio.`
    ],
    sections: [
      {
        heading: '1. Identificación del responsable',
        blocks: [
          'El sitio es operado por:',
          [
            `Nombre comercial: ${COMPANY}`,
            `RFC: ${RFC}`,
            `Domicilio: ${ADDRESS}`,
            `Teléfono: ${PHONE}`,
            `Correo electrónico: ${EMAIL}`
          ]
        ]
      },
      {
        heading: '2. Uso del sitio',
        blocks: [
          `${COMPANY} es una vitrina donde desarrolladores publican sus proyectos con el enlace a su repositorio, y otras personas los buscan, los califican, los comentan, los guardan y los reportan. El uso del sitio es personal y con fines lícitos.`,
          'Te comprometes a no:',
          [
            'Dar información falsa o de otra persona sin su autorización.',
            'Publicar proyectos que no sean tuyos o que no tengas permiso de mostrar.',
            'Publicar spam, contenido ofensivo, plagio o enlaces maliciosos.',
            'Intentar entrar a cuentas o secciones que no te correspondan, como el panel del administrador.',
            'Usar programas automáticos para extraer información, calificar o publicar.',
            'Usar el sitio para dañar a otras personas o a la plataforma.'
          ],
          'Cualquier persona con cuenta puede reportar un proyecto o un comentario. El administrador puede ocultar el contenido que no cumpla estos términos o las reglas de publicación, y te avisará por correo con el motivo. El incumplimiento puede dar lugar a las acciones legales que correspondan.'
        ]
      },
      {
        heading: '3. Registro de usuarios',
        blocks: [
          'Para publicar, calificar, comentar, guardar, reportar o pagar necesitas una cuenta. Declaras bajo protesta de decir verdad que eres mayor de 18 años y que tienes capacidad legal para aceptar estos términos. El sitio está dirigido solo a personas mayores de edad.',
          'Para registrarte se piden nombre completo, nombre de usuario, correo electrónico y contraseña. El correo y el nombre de usuario son únicos, y la cuenta se activa al verificar tu correo con un código.',
          'Eres responsable de mantener tu contraseña en secreto y de todo lo que se haga desde tu cuenta. Por seguridad, la sesión se cierra sola a las 8 horas y la cuenta se bloquea 15 minutos después de 5 intentos fallidos.',
          `${COMPANY} no pide identificaciones para comprobar la edad. Si un menor de edad se registra diciendo ser mayor, la responsabilidad es suya y de quien ejerza la patria potestad o tutela.`
        ]
      },
      {
        heading: '4. Productos y servicios',
        blocks: [
          `Publicar, buscar, calificar y guardar proyectos es gratuito. Con la cuenta gratuita puedes tener hasta 3 proyectos publicados al mismo tiempo. Además, ${COMPANY} ofrece dos servicios de pago:`,
          [
            'Plan Pro (30 días): proyectos publicados sin límite, estadísticas de visitas y distintivo Pro en tu perfil.',
            'Proyecto destacado (7 o 30 días): tu proyecto aparece en la sección de destacados del inicio y primero en las búsquedas.'
          ],
          `${COMPANY} no vende software. Los proyectos y su código pertenecen a sus autores y se consultan en su repositorio. La etiqueta "Abierto a colaborar" solo sirve para que otras personas te contacten: ${COMPANY} no interviene ni se hace responsable de los acuerdos entre usuarios.`
        ]
      },
      {
        heading: '5. Precios',
        blocks: [
          'Los precios están en pesos mexicanos (MXN) y son el total a pagar:',
          [
            'Plan Pro: $119.00 por 30 días.',
            'Proyecto destacado: $149.00 por 7 días o $399.00 por 30 días.'
          ],
          'El monto cobrado es el que calcula el sistema al momento del pago. Los precios pueden cambiar en cualquier momento sin afectar los servicios ya pagados.'
        ]
      },
      {
        heading: '6. Métodos de pago',
        blocks: [
          `El pago se hace con PayPal: el sitio te lleva a PayPal, donde autorizas el pago, y después te regresa. ${COMPANY} no recibe ni guarda números de tarjeta ni datos bancarios. El uso de PayPal se rige por sus propios términos y condiciones.`,
          'Son pagos únicos: no hay cargos automáticos ni renovaciones sin tu autorización. Si vuelves a pagar el Plan Pro o un destacado que sigue vigente, los días se suman al final del periodo actual.',
          `${COMPANY} no es responsable de rechazos, demoras, comisiones o cargos aplicados por PayPal o por tu banco. Si el pago se rechaza o lo cancelas, no se activa ningún servicio.`
        ]
      },
      {
        heading: '7. Entrega del servicio',
        blocks: [
          'Los servicios son digitales y no hay envíos físicos. El Plan Pro o el destacado se activan en cuanto PayPal confirma el pago, y te enviamos el comprobante al correo con el que te registraste. Puedes consultar tus pagos y la vigencia de tus servicios en Mi cuenta › Plan y pagos.'
        ]
      },
      {
        heading: '8. Cancelaciones',
        blocks: [
          'Puedes cancelar la compra en PayPal antes de autorizar el pago. Una vez activado, el servicio no se puede cancelar y termina al final del periodo pagado. Mientras un proyecto esté destacado no se puede desactivar ni eliminar, para que no pierdas lo que pagaste.',
          'Al vencer el Plan Pro se quedan publicados tus 3 proyectos más antiguos (y los que sigan destacados) y los demás pasan a desactivados. No se borra nada: tú decides cuáles reactivar.'
        ]
      },
      {
        heading: '9. Devoluciones y reembolsos',
        blocks: [
          'Por tratarse de servicios digitales que se activan de inmediato, no hay devoluciones una vez activados. Las excepciones son:',
          [
            'Si PayPal hizo el cobro pero el sitio no pudo activar el servicio, el sistema reembolsa el pago de forma automática.',
            `Si ves un cobro en PayPal y el servicio no aparece en tu cuenta, escríbenos a ${EMAIL} con tu número de orden para revisarlo y, en su caso, reembolsarlo.`
          ],
          'No hay reembolso si el administrador retira un destacado u oculta un proyecto por incumplir estos términos o las reglas de publicación, ni si eliminas tu cuenta con servicios vigentes.'
        ]
      },
      {
        heading: '10. Garantías',
        blocks: [
          `${COMPANY} garantiza que el servicio pagado estará activo durante todo el periodo contratado. Si por una falla del sitio no pudiste usarlo, escríbenos y repondremos los días afectados o reembolsaremos la parte proporcional, conforme a la Ley Federal de Protección al Consumidor.`,
          `${COMPANY} no garantiza un número de visitas, calificaciones o contactos para tus proyectos.`
        ]
      },
      {
        heading: '11. Responsabilidades',
        blocks: [
          `Salvo que la ley indique otra cosa, ${COMPANY} no es responsable de:`,
          [
            'El contenido, funcionamiento o seguridad de los proyectos, repositorios y demostraciones publicados por los usuarios, ni de los sitios externos a los que llevan.',
            'Las calificaciones y comentarios que publican otros usuarios.',
            'Los acuerdos de colaboración entre usuarios.',
            'Interrupciones o fallas del sitio por mantenimiento, problemas de conexión, caso fortuito o fuerza mayor.',
            'Fallas de servicios de terceros, como PayPal o el servicio de correo.',
            'Datos incorrectos que des, incluido un correo equivocado.',
            'El uso de tu cuenta por descuido en el cuidado de tu contraseña.',
            'El registro de menores de edad que declaren falsamente ser mayores.'
          ],
          'Eres responsable de los daños que causes a la plataforma o a terceros por el mal uso del sitio.'
        ]
      },
      {
        heading: '12. Propiedad intelectual',
        blocks: [
          `El nombre, el logotipo, el diseño, los textos, el código y la base de datos de ${COMPANY} son de su propiedad y están protegidos por la Ley Federal del Derecho de Autor. Queda prohibido copiarlos, distribuirlos o modificarlos sin autorización por escrito.`,
          `Tus proyectos, imágenes y textos siguen siendo tuyos. Al publicarlos, declaras que eres su autor o que tienes permiso para mostrarlos, y le das a ${COMPANY} permiso gratuito y no exclusivo de mostrarlos en el sitio mientras estén publicados. Si alguien publica algo tuyo sin permiso, puedes reportarlo como plagio.`
        ]
      },
      {
        heading: '13. Privacidad',
        blocks: [
          `El uso de tus datos personales se rige por el Aviso de privacidad de ${COMPANY}, que forma parte de estos términos y aceptas al registrarte. En resumen: pedimos solo los datos necesarios, la contraseña se guarda cifrada, tu correo nunca es público, no vendemos tus datos y puedes ejercer tus derechos ARCO desde tu cuenta o por los medios de contacto.`
        ]
      },
      {
        heading: '14. Modificaciones',
        blocks: [
          'Podemos modificar estos términos en cualquier momento. Los cambios se publican en esta página con su fecha y versión, y aplican desde su publicación. A los servicios ya pagados se les aplican los términos vigentes al momento del pago. Si el cambio es importante, te pediremos aceptarlos de nuevo; seguir usando el sitio después de un cambio implica que lo aceptas.'
        ]
      },
      {
        heading: '15. Contacto',
        blocks: [
          'Para dudas, aclaraciones, reclamaciones o derechos ARCO puedes comunicarte por:',
          [
            `Correo electrónico: ${EMAIL}`,
            `Teléfono: ${PHONE}`,
            `Domicilio: ${ADDRESS}`
          ]
        ]
      },
      {
        heading: '16. Legislación aplicable y jurisdicción',
        blocks: [
          'Estos términos se rigen por las leyes de los Estados Unidos Mexicanos, en particular la Ley Federal de Protección al Consumidor, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, el Código de Comercio y la Ley Federal del Derecho de Autor, y siguen las buenas prácticas de la norma NMX-COE-001-SCFI-2018 de comercio electrónico. Para su interpretación y cumplimiento, las partes se someten a los tribunales de Zapopan, Jalisco, sin perjuicio de los derechos que la ley otorga al consumidor ante la Procuraduría Federal del Consumidor (PROFECO).'
        ]
      }
    ]
  },
  rules: {
    title: 'Reglas de publicación',
    version: '1.0',
    updated: '25 de noviembre de 2026',
    intro: [
      'Estas reglas forman parte de los Términos y condiciones y explican qué se puede publicar y cómo.'
    ],
    sections: [
      {
        heading: 'Publicación',
        blocks: [
          'Los proyectos se publican al instante, sin revisión previa. El administrador revisa los que se reportan.'
        ]
      },
      {
        heading: 'Datos del proyecto',
        blocks: [
          [
            'Título de 5 a 80 caracteres y descripción de 50 a 2000 caracteres.',
            'Nombre corto de 3 a 20 caracteres: letras, números, espacios, guion y punto. Es el que aparece en la insignia.',
            'Un tipo de proyecto de la lista y de 1 a 5 tecnologías del catálogo.'
          ]
        ]
      },
      {
        heading: 'Repositorio y demostración',
        blocks: [
          'El repositorio es obligatorio y debe ser público, de GitHub, GitLab o Bitbucket. Un mismo repositorio no puede publicarse dos veces.',
          'El enlace de demostración es opcional, debe ser https y distinto al del repositorio.'
        ]
      },
      {
        heading: 'Imágenes',
        blocks: [
          'De 1 a 4 imágenes por proyecto, en jpg, png o webp, de máximo 2 MB y mínimo 400 × 300 píxeles. La primera es la portada.'
        ]
      },
      {
        heading: 'Etiquetas',
        blocks: [
          '"Busco retroalimentación" y "Abierto a colaborar" son opcionales. "Abierto a colaborar" solo se puede marcar si tu perfil tiene al menos un enlace de contacto.'
        ]
      },
      {
        heading: 'Calificaciones y comentarios',
        blocks: [
          'Se califican 5 criterios del 1 al 5: diseño, utilidad, calidad del código, documentación e innovación. Una calificación por persona y proyecto, nunca en el propio.',
          'El comentario es opcional: vacío o de 10 a 500 caracteres.'
        ]
      },
      {
        heading: 'Qué se oculta',
        blocks: [
          'Spam, contenido ofensivo, plagio, repositorios que no existen o son privados y enlaces maliciosos. El contenido oculto deja de verse para los demás y su autor recibe el motivo por correo.'
        ]
      }
    ]
  }
};

@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  templateUrl: './legal.html',
  styleUrl: './legal.css'
})
export class Legal implements OnInit {
  page = signal<LegalPage>('privacy');

  // El documento que toca según la dirección
  document = computed(() => DOCUMENTS[this.page()]);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Con subscribe se actualiza al pasar de un aviso a otro sin salir de la pantalla
    this.route.paramMap.subscribe(params => {
      const page = params.get('page');
      this.page.set(page === 'terms' || page === 'rules' ? page : 'privacy');
      window.scrollTo(0, 0);
    });
  }

  // Un bloque es lista si es un arreglo de textos
  isList(block: LegalBlock): block is string[] {
    return Array.isArray(block);
  }
}

