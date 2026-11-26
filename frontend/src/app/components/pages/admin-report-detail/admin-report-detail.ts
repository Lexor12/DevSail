import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { ReportDetail, ReportStatus } from '../../../models/admin.model';
import { formatDate, score } from '../../../utils/format';
 
// Pantalla 15: detalle de un reporte y decisión del administrador (HU-16 criterios 2 y 3)
// Ocultar retira el proyecto o el comentario y le avisa al autor por correo
// Descartar cierra el reporte sin tocar el contenido
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
 
  readonly formatDate = formatDate;
  readonly score = score;
 
  private reportId = '';
 
  constructor(private route: ActivatedRoute, private adminService: AdminService) {}
 
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
 
  // El backend pide un motivo de 5 a 300 caracteres en las dos decisiones
  resolve(decision: 'hide' | 'dismiss'): void {
    const reason = this.reason().trim();
    if (reason.length < 5) {
      this.error.set('Escribe un motivo de al menos 5 caracteres.');
      return;
    }
    const question = decision === 'hide'
      ? '¿Ocultar este contenido? El autor recibirá un correo con el motivo.'
      : '¿Descartar este reporte? El contenido seguirá visible.';
    if (!confirm(question)) return;
 
    this.error.set('');
    this.sending.set(true);
    this.adminService.resolveReport(this.reportId, decision, reason).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.sending.set(false);
        this.load();
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo resolver el reporte.');
      }
    });
  }
 
  statusText(status: ReportStatus): string {
    if (status === 'pending') return 'Pendiente';
    if (status === 'resolved_hidden') return 'Contenido oculto';
    return 'Descartado';
  }
}