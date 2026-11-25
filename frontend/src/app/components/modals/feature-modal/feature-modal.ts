import { Component, OnInit, input, output, signal } from '@angular/core';
import { PaymentService } from '../../../services/payment.service';
import { ProjectService } from '../../../services/project.service';
import { OwnerProject } from '../../../models/project-detail.model';

//Este modal sirve para destacar un proyecto
// Si llega projectId ese proyecto aparece ya elegido
@Component({
  selector: 'app-feature-modal',
  templateUrl: './feature-modal.html',
  styleUrl: './feature-modal.css'
})
export class FeatureModal implements OnInit {
  projectId = input<string | null>(null);
  closed = output<void>();

  projects = signal<OwnerProject[]>([]);
  duration = signal<'featured_7' | 'featured_30'>('featured_7');
  accepted = signal(false);
  sending = signal(false);
  error = signal('');

  constructor(private paymentService: PaymentService, private projectService: ProjectService) {}

  ngOnInit(): void {
    // Solo se pueden destacar proyectos publicados
    this.projectService.getMyProjects().subscribe({
      next: (response) => this.projects.set(response.projects.filter(p => p.status === 'published'))
    });
  }

  chooseDuration(event: Event): void {
    this.duration.set((event.target as HTMLInputElement).value as 'featured_7' | 'featured_30');
  }

  toggleTerms(event: Event): void {
    this.accepted.set((event.target as HTMLInputElement).checked);
  }

  pay(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const projectId = data.get('projectId') as string;
    if (!projectId) {
      this.error.set('Elige un proyecto.');
      return;
    }

    this.sending.set(true);
    this.error.set('');
    this.paymentService.createOrder(this.duration(), projectId).subscribe({
      next: (response) => (window.location.href = response.approveUrl),
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo iniciar el pago.');
      }
    });
  }
}