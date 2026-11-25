import { Component, OnInit, input, output, signal } from '@angular/core';
import { ReportService } from '../../../services/report.service';
import { ReportReason } from '../../../models/report.model';
 
// M03 Reportar contenido se abre desde 06 (proyecto o comentario)
@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.html',
  styleUrl: './report-modal.css'
})
export class ReportModal implements OnInit {
  targetType = input.required<'project' | 'comment'>();
  targetId = input.required<string>();
  targetLabel = input.required<string>();
  closed = output<void>();
  sent = output<string>();
 
  reasons = signal<ReportReason[]>([]);
  detailLength = signal(0);
  error = signal('');
  sending = signal(false);
 
  constructor(private reportService: ReportService) {}
 
  ngOnInit(): void {
    this.reportService.getReasons().subscribe({
      next: (response) => this.reasons.set(response.reasons),
      error: () => this.error.set('No se pudieron cargar los motivos.')
    });
  }
 
  countDetail(event: Event): void {
    this.detailLength.set((event.target as HTMLTextAreaElement).value.length);
  }
 
  submit(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const reasonId = data.get('reasonId') as string | null;
 
    if (!reasonId) {
      this.error.set('Elige un motivo.');
      return;
    }
 
    this.sending.set(true);
    this.error.set('');
    this.reportService.create({
      targetType: this.targetType(),
      targetId: this.targetId(),
      reasonId,
      detail: (data.get('detail') as string).trim()
    }).subscribe({
      next: (response) => this.sent.emit(response.message),
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo enviar el reporte.');
      }
    });
  }
}