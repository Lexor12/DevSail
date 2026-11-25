import { Component, OnInit, computed, signal } from '@angular/core';
import { PaymentService } from '../../../services/payment.service';
import { ProjectService } from '../../../services/project.service';
import { MyPayments, Payment } from '../../../models/payment.model';
import { OwnerProject } from '../../../models/project-detail.model';
import { formatDate } from '../../../utils/format';
import { AccountMenu } from '../../shared/account-menu/account-menu';
import { ProPlanModal } from '../../modals/pro-plan-modal/pro-plan-modal';
import { FeatureModal } from '../../modals/feature-modal/feature-modal';

// 11 Mi cuenta Plan y pagos ruta /my-account/plan
@Component({
  selector: 'app-plan-payments',
  imports: [AccountMenu, ProPlanModal, FeatureModal],
  templateUrl: './plan-payments.html',
  styleUrl: './plan-payments.css'
})
export class PlanPayments implements OnInit {
  data = signal<MyPayments | null>(null);
  projects = signal<OwnerProject[]>([]);
  error = signal('');
  showProPlan = signal(false);
  showFeature = signal(false);

  readonly formatDate = formatDate;

  // Proyectos con destacado vigente (los manda "Mis proyectos" con featuredEndsAt)
  featured = computed(() => this.projects().filter(p => p.featuredEndsAt));

  constructor(private paymentService: PaymentService, private projectService: ProjectService) {}

  ngOnInit(): void {
    this.paymentService.getMyPayments().subscribe({
      next: (data) => this.data.set(data),
      error: (error) => this.error.set(error.error?.message || 'No se pudo cargar tu plan.')
    });
    this.projectService.getMyProjects().subscribe({
      next: (response) => this.projects.set(response.projects)
    });
  }

  // Días que le quedan a un destacado
  daysLeft(date: string | null): number {
    if (!date) return 0;
    return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  }

  conceptText(payment: Payment): string {
    if (payment.concept === 'pro_plan') return 'Plan Pro 30 días';
    if (payment.concept === 'featured_7') return 'Destacado 7 días';
    return 'Destacado 30 días';
  }

  statusText(payment: Payment): string {
    const texts: Record<string, string> = { completed: 'Completado', pending: 'Pendiente', cancelled: 'Cancelado', failed: 'Fallido' };
    return texts[payment.status] ?? payment.status;
  }
}