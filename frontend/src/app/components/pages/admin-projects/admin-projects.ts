import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModerationService } from '../../../services/moderation.service';
import { AdminProject } from '../../../models/moderation.model';
import { formatDate, score } from '../../../utils/format';
//Este componente permite a un administrador moderar los proyectos, es decir que ocultar o desocultarlos, para ocultarlos pide un motivo,el cual se notifica al usuario
@Component({
  selector: 'app-admin-projects',
  imports: [RouterLink],
  templateUrl: './admin-projects.html',
  styleUrl: './admin-projects.css'
})
export class AdminProjects implements OnInit {
  projects = signal<AdminProject[]>([]);
  total = signal(0);
  status = signal('');
  text = signal('');
  page = signal(1);
  loading = signal(true);
  error = signal('');
  message = signal('');

  // Proyecto que se va a ocultar, abre la caja del motivo
  hiding = signal<AdminProject | null>(null);
  reason = signal('');
  sending = signal(false);

  readonly pageSize = 10;
  readonly formatDate = formatDate;
  readonly score = score;

  lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  constructor(private route: ActivatedRoute, private moderationService: ModerationService) {}

  ngOnInit(): void {
    // Si viene del resumen con ?status=hidden, empieza con ese filtro
    this.status.set(this.route.snapshot.queryParamMap.get('status') ?? '');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.moderationService.getProjects(this.status(), this.text(), this.page()).subscribe({
      next: (response) => {
        // Si la página se quedó vacía al moderar se regresa a la anterior
        if (response.projects.length === 0 && this.page() > 1) {
          this.changePage(this.page() - 1);
          return;
        }
        this.projects.set(response.projects);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar los proyectos.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    this.status.set((data.get('status') as string) || '');
    this.text.set(((data.get('text') as string) || '').trim());
    this.page.set(1);
    this.load();
  }

  changePage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openHide(project: AdminProject): void {
    this.hiding.set(project);
    this.reason.set('');
    this.error.set('');
  }

  typeReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  // Ocultar pide motivo de 10 a 300 caracteres, el autor lo recibe por correo
  confirmHide(): void {
    const project = this.hiding();
    if (!project) return;
    if (this.reason().trim().length < 10) {
      this.error.set('Escribe un motivo de al menos 10 caracteres.');
      return;
    }
    this.send(project.id, 'hide', this.reason().trim());
  }

  show(project: AdminProject): void {
    if (!confirm(`¿Volver a mostrar «${project.title}»?`)) return;
    this.send(project.id, 'show', '');
  }

  private send(id: string, action: 'hide' | 'show', reason: string): void {
    this.sending.set(true);
    this.moderationService.setProjectVisibility(id, action, reason).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.hiding.set(null);
        this.sending.set(false);
        this.load();
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo cambiar la visibilidad.');
      }
    });
  }

  statusText(status: string): string {
    if (status === 'published') return 'Publicado';
    if (status === 'deactivated') return 'Desactivado';
    return 'Oculto';
  }
}

