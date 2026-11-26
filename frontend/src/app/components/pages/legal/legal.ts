import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

// Avisos legales (HU-21): aviso de privacidad, términos y reglas de publicación
// Se abren desde el pie de página en /legal/privacy, /legal/terms y /legal/rules

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

interface LegalDocument {
  title: string;
  version: string;
  updated: string;
  sections: LegalSection[];
}

type LegalPage = 'privacy' | 'terms' | 'rules';

const DOCUMENTS: Record<LegalPage, LegalDocument> = {
  privacy: {
    title: 'Aviso de privacidad',
    version: '1.0',
    updated: '25 de noviembre de 2026',
    sections: [
      {
        heading: 'Quién usa tus datos',
        paragraphs: [
          'DevSail es un proyecto escolar del CETI plantel Colomos. Este aviso explica qué datos pedimos, para qué los usamos y cómo puedes pedir que se borren.'
        ]
      },
      {
        heading: 'Datos que pedimos',
        paragraphs: [
          'Al crear tu cuenta: nombre completo, nombre de usuario, correo y contraseña. La contraseña se guarda encriptada y nadie puede leerla.',
          'Si tú lo decides: foto de perfil, biografía y enlaces a LinkedIn, sitio personal, GitHub, GitLab, Bitbucket, Instagram y YouTube.',
          'Al publicar: los datos del proyecto, sus imágenes y el enlace a su repositorio.'
        ]
      },
      {
        heading: 'Qué es público',
        paragraphs: [
          'Tu nombre público, tu nombre de usuario, tu foto, tu biografía, los enlaces de tu perfil, tus proyectos publicados y tus calificaciones con comentario los puede ver cualquier persona, aunque no tenga cuenta.',
          'Tu correo nunca se muestra en el sitio.'
        ]
      },
      {
        heading: 'Para qué los usamos',
        paragraphs: [
          'Para crear y proteger tu cuenta, mostrar tus proyectos, mandarte códigos de verificación, comprobantes de pago y avisos de moderación por correo.',
          'Las visitas a los proyectos se cuentan sin guardar quién visitó ni su dirección IP.'
        ]
      },
      {
        heading: 'Pagos',
        paragraphs: [
          'Los pagos se hacen en PayPal. DevSail no recibe ni guarda los datos de tu tarjeta o de tu cuenta de PayPal; solo guarda el número de la orden, el monto y su estado.'
        ]
      },
      {
        heading: 'Cookies',
        paragraphs: [
          'Usamos una sola cookie para mantener tu sesión iniciada durante 8 horas. No usamos cookies de publicidad.'
        ]
      },
      {
        heading: 'Tus derechos',
        paragraphs: [
          'Puedes ver y corregir tus datos en Mi cuenta › Mis datos. Puedes eliminar tu cuenta en Mi cuenta › Zona de peligro: se borran tu perfil, proyectos, calificaciones, comentarios y guardados.',
          'Tus pagos y reportes se conservan sin tus datos personales, porque son el registro de lo que pasó en el sitio.'
        ]
      }
    ]
  },
  terms: {
    title: 'Términos y condiciones',
    version: '1.0',
    updated: '25 de noviembre de 2026',
    sections: [
      {
        heading: 'Uso del sitio',
        paragraphs: [
          'DevSail es una vitrina para que desarrolladores muestren sus proyectos y reciban calificaciones de otras personas. Al crear tu cuenta aceptas estos términos.',
          'Debes tener una sola cuenta, dar datos reales y cuidar tu contraseña.'
        ]
      },
      {
        heading: 'Tus proyectos',
        paragraphs: [
          'Solo puedes publicar proyectos que sean tuyos o que tengas permiso de mostrar. El código sigue siendo de su autor; DevSail solo muestra el enlace al repositorio.',
          'Con la cuenta gratuita puedes tener hasta 3 proyectos publicados al mismo tiempo.'
        ]
      },
      {
        heading: 'Colaboraciones',
        paragraphs: [
          'La etiqueta "Abierto a colaborar" solo sirve para que otras personas te contacten. DevSail no interviene en los acuerdos de colaboración entre personas ni responde por ellos.'
        ]
      },
      {
        heading: 'Plan Pro y destacados',
        paragraphs: [
          'El Plan Pro cuesta $119 MXN por 30 días y quita el límite de proyectos publicados y activa las estadísticas de visitas. Destacar un proyecto cuesta $149 MXN por 7 días o $399 MXN por 30 días.',
          'Son pagos únicos en PayPal, sin cobro automático. Si vuelves a pagar antes de que termine, los días se suman al final del periodo.',
          'No hay reembolsos, salvo cuando PayPal cobró pero el sitio no pudo activar lo que compraste.',
          'Cuando vence el Plan Pro, se quedan publicados tus 3 proyectos más antiguos (y los que estén destacados) y los demás pasan a desactivados. Tú decides cuáles reactivar.'
        ]
      },
      {
        heading: 'Moderación',
        paragraphs: [
          'Cualquier persona con cuenta puede reportar un proyecto o un comentario. El administrador puede ocultar contenido que no cumpla las reglas de publicación o retirar un destacado; en ese caso te avisa por correo con el motivo.',
          'Un destacado retirado por incumplir las reglas no se reembolsa.'
        ]
      },
      {
        heading: 'Cuenta',
        paragraphs: [
          'Puedes eliminar tu cuenta cuando quieras desde Zona de peligro. Esta acción no se puede deshacer.'
        ]
      }
    ]
  },
  rules: {
    title: 'Reglas de publicación',
    version: '1.0',
    updated: '25 de noviembre de 2026',
    sections: [
      {
        heading: 'Publicación',
        paragraphs: [
          'Los proyectos se publican al instante, sin revisión previa. El administrador revisa los que se reportan.'
        ]
      },
      {
        heading: 'Datos del proyecto',
        paragraphs: [
          'Título de 5 a 80 caracteres y descripción de 50 a 2000 caracteres.',
          'Nombre corto de 3 a 20 caracteres: letras, números, espacios, guion y punto. Es el que aparece en la insignia.',
          'Un tipo de proyecto de la lista y de 1 a 5 tecnologías del catálogo.'
        ]
      },
      {
        heading: 'Repositorio y demostración',
        paragraphs: [
          'El repositorio es obligatorio y debe ser público, de GitHub, GitLab o Bitbucket. Un mismo repositorio no puede publicarse dos veces.',
          'El enlace de demostración es opcional, debe ser https y distinto al del repositorio.'
        ]
      },
      {
        heading: 'Imágenes',
        paragraphs: [
          'De 1 a 4 imágenes por proyecto, en jpg, png o webp, de máximo 2 MB y mínimo 400 × 300 píxeles. La primera es la portada.'
        ]
      },
      {
        heading: 'Etiquetas',
        paragraphs: [
          '"Busco retroalimentación" y "Abierto a colaborar" son opcionales. "Abierto a colaborar" solo se puede marcar si tu perfil tiene al menos un enlace de contacto.'
        ]
      },
      {
        heading: 'Calificaciones y comentarios',
        paragraphs: [
          'Se califican 5 criterios del 1 al 5: diseño, utilidad, calidad del código, documentación e innovación. Una calificación por persona y proyecto, nunca en el propio.',
          'El comentario es opcional: vacío o de 10 a 500 caracteres.'
        ]
      },
      {
        heading: 'Qué se oculta',
        paragraphs: [
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
}
