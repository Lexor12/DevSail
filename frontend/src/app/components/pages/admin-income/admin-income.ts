import { Component, OnInit, computed, signal } from '@angular/core';
import { PaymentService } from '../../../services/payment.service';
import { AdminPayment, IncomeFilters, PaymentConcept } from '../../../models/payment.model';
import { formatDate } from '../../../utils/format';

//Ingresos del sitio para el administrador
@Component({
  selector: 'app-admin-income',
  imports: [],
  templateUrl: './admin-income.html',
  styleUrl: './admin-income.css'
})
export class AdminIncome implements OnInit {
  payments = signal<AdminPayment[]>([]);
  total = signal(0);
  completedAmount = signal(0);
  completedCount = signal(0);
  filters = signal<IncomeFilters>({ dateFrom: '', dateTo: '', concept: '', status: '', username: '', page: 1 });
  loading = signal(true);
  error = signal('');

  readonly pageSize = 10;
  readonly formatDate = formatDate;

  lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.paymentService.getIncome(this.filters()).subscribe({
      next: (response) => {
        this.payments.set(response.payments);
        this.total.set(response.total);
        this.completedAmount.set(response.summary.completedAmount);
        this.completedCount.set(response.summary.completedCount);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar los ingresos.');
        this.loading.set(false);
      }
    });
  }

  applyFilters(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    this.filters.set({
      dateFrom: (data.get('dateFrom') as string) || '',
      dateTo: (data.get('dateTo') as string) || '',
      concept: (data.get('concept') as string) || '',
      status: (data.get('status') as string) || '',
      username: ((data.get('username') as string) || '').trim(),
      page: 1
    });
    this.load();
  }

  changePage(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.load();
  }

  money(value: number): string {
    return '$' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  conceptText(concept: PaymentConcept): string {
    if (concept === 'pro_plan') return 'Plan Pro (30 días)';
    if (concept === 'featured_7') return 'Destacado (7 días)';
    return 'Destacado (30 días)';
  }

  statusText(status: string): string {
    if (status === 'completed') return 'Completado';
    if (status === 'pending') return 'Pendiente';
    if (status === 'cancelled') return 'Cancelado';
    if (status === 'refunded') return 'Reembolsado';
    return 'Fallido';
  }
}
