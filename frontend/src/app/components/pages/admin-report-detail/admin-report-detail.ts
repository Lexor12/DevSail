import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { ModerationService } from '../../../services/moderation.service';
import { ReportDetail, ReportStatus } from '../../../models/admin.model';
import { formatDate, score } from '../../../utils/format';

// La base de datos pide motivos de 10 a 300 caracteres
const MIN_REASON = 10;

//Pantalla 15: detalle de un reporte y decisión del administrador
//Ocultar retira el proyecto o el comentario y le avisa al autor por correo
//Descartar cierra el reporte sin tocar el contenido
//Volver a mostrar deshace un ocultamiento, aunque el reporte ya esté resuelto
@Component({
  selector: 'app-admin-report-detail',
  imports: [RouterLink],
  templateUrl: './admin-report-detail.html',
  styleUrl: './admin-report-detail.css'
})
export class AdminReportDetail implements OnInit {
  detail = signal<ReportDetail | null>(null);
  loading = signal(true);
  error = signal('');
  message = signal('');
  reason = signal('');
  sending = signal(false);

  readonly minReason = MIN_REASON;
  readonly formatDate = formatDate;
  readonly score = score;

  // Si el contenido ya está oculto (por este reporte o porque el admin lo ocultó por aparte)
  targetHidden = computed(() => {
    const d = this.detail();
    if (!d || !d.targetContent) return false;
    return d.report.targetType === 'project'
      ? d.targetContent.status === 'hidden'
      : d.targetContent.commentHidden === true;
  });

  private reportId = '';

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private moderationService: ModerationService
  ) {}

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminService.getReport(this.reportId).subscribe({
      next: (response) => {
        this.detail.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudo cargar el reporte.');
        this.loading.set(false);
      }
    });
  }

  typeReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  // Ocultar o descartar, las dos piden motivo
  resolve(decision: 'hide' | 'dismiss'): void {
    const reason = this.reason().trim();
    if (reason.length < MIN_REASON) {
      this.error.set(`Escribe un motivo de al menos ${MIN_REASON} caracteres.`);
      return;
    }
    let question = '¿Descartar este reporte? El contenido seguirá visible.';
    if (decision === 'hide') {
      question = this.targetHidden()
        ? 'El contenido ya está oculto. ¿Cerrar el reporte?'
        : '¿Ocultar este contenido? El autor recibirá un correo con el motivo.';
    }
    if (!confirm(question)) return;

    this.error.set('');
    this.sending.set(true);
    this.adminService.resolveReport(this.reportId, decision, reason).subscribe({
      next: (response) => this.done(response.message),
      error: (error) => this.fail(error, 'No se pudo resolver el reporte.')
    });
  }

  // Deshace el ocultamiento del proyecto o del comentario
  showAgain(): void {
    const d = this.detail();
    if (!d || !d.targetContent) return;
    if (!confirm('¿Volver a mostrar este contenido a todos?')) return;

    this.error.set('');
    this.sending.set(true);
    const request = d.report.targetType === 'project'
      ? this.moderationService.setProjectVisibility(d.targetContent.id, 'show', '')
      : this.moderationService.setCommentVisibility(d.targetContent.id, 'show', '');
    request.subscribe({
      next: (response) => this.done(response.message),
      error: (error) => this.fail(error, 'No se pudo volver a mostrar el contenido.')
    });
  }

  statusText(status: ReportStatus): string {
    if (status === 'pending') return 'Pendiente';
    if (status === 'resolved_hidden') return 'Contenido oculto';
    return 'Descartado';
  }

  private done(text: string): void {
    this.message.set(text);
    this.sending.set(false);
    this.load();
  }

  private fail(error: { error?: { message?: string } }, text: string): void {
    this.sending.set(false);
    this.error.set(error.error?.message || text);
  }
}
