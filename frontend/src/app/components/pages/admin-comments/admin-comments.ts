import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModerationService } from '../../../services/moderation.service';
import { AdminComment } from '../../../models/moderation.model';
import { formatDate } from '../../../utils/format';

//Este componente muestra la seccion de moderacion de componentes para el administrador, este muestra todos los componentes actuales, el total, filtros, y permite ocultarlos
// Al ocultar un comentario la calificación sigue contando en el promedio
@Component({
  selector: 'app-admin-comments',
  imports: [RouterLink],
  templateUrl: './admin-comments.html',
  styleUrl: './admin-comments.css'
})
export class AdminComments implements OnInit {
  comments = signal<AdminComment[]>([]);
  total = signal(0);
  hidden = signal('');
  page = signal(1);
  loading = signal(true);
  error = signal('');
  message = signal('');

  // Comentario que se va a ocultar, abre la caja del motivo
  hiding = signal<AdminComment | null>(null);
  reason = signal('');
  sending = signal(false);

  readonly pageSize = 10;
  readonly formatDate = formatDate;

  lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  constructor(private route: ActivatedRoute, private moderationService: ModerationService) {}

  ngOnInit(): void {
    // Si viene del resumen con ?hidden=true, empieza con los ocultos
    this.hidden.set(this.route.snapshot.queryParamMap.get('hidden') ?? '');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.moderationService.getComments(this.hidden(), this.page()).subscribe({
      next: (response) => {
        this.comments.set(response.comments);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar los comentarios.');
        this.loading.set(false);
      }
    });
  }

  changeFilter(event: Event): void {
    this.hidden.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  changePage(page: number): void {
    this.page.set(page);
    this.load();
  }

  openHide(comment: AdminComment): void {
    this.hiding.set(comment);
    this.reason.set('');
    this.error.set('');
  }

  typeReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  confirmHide(): void {
    const comment = this.hiding();
    if (!comment) return;
    if (this.reason().trim().length < 10) {
      this.error.set('Escribe un motivo de al menos 10 caracteres.');
      return;
    }
    this.send(comment.id, 'hide', this.reason().trim());
  }

  show(comment: AdminComment): void {
    if (!confirm('¿Volver a mostrar este comentario?')) return;
    this.send(comment.id, 'show', '');
  }

  private send(id: string, action: 'hide' | 'show', reason: string): void {
    this.sending.set(true);
    this.moderationService.setCommentVisibility(id, action, reason).subscribe({
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
}

