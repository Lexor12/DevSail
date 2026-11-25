import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { Analytics } from '../../../models/payment.model';
import { AccountMenu } from '../../shared/account-menu/account-menu';
import { ProPlanModal } from '../../modals/pro-plan-modal/pro-plan-modal';

//Sección de estadísticas de Mi cuenta
@Component({
  selector: 'app-stats',
  imports: [AccountMenu, ProPlanModal],
  templateUrl: './stats.html',
  styleUrl: './stats.css'
})
export class Stats implements OnInit {
  data = signal<Analytics | null>(null);
  days = signal(30);
  projectId = signal('');
  notPro = signal(false);
  error = signal('');
  showProPlan = signal(false);

  // Si hay un proyecto elegido las 4 cajas de arriba solo cuentan ese
  totals = computed(() => {
    const rows = (this.data()?.projectsBreakdown ?? []).filter(p => !this.projectId() || p.projectId === this.projectId());
    const sum = (field: 'totalVisits' | 'visits7d' | 'visits30d' | 'savesCount') => rows.reduce((total, p) => total + p[field], 0);
    return { total: sum('totalVisits'), week: sum('visits7d'), month: sum('visits30d'), saves: sum('savesCount') };
  });

  // El backend solo manda días con visitas y aquí los demás se rellenan con 0
  bars = computed(() => {
    const series = this.data()?.dailySeries ?? [];
    const list: { date: string; visits: number }[] = [];
    for (let i = this.days() - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const key = day.toLocaleDateString('en-CA'); // queda como año, mes y día
      const found = series.find(s => s.date === key);
      list.push({ date: key, visits: found ? found.visits : 0 });
    }
    return list;
  });

  maxVisits = computed(() => Math.max(1, ...this.bars().map(b => b.visits)));

  constructor(private paymentService: PaymentService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Desde Mis proyectos se puede llegar con un proyecto ya elegido
    this.projectId.set(this.route.snapshot.queryParamMap.get('project') ?? '');
    this.load();
  }

  load(): void {
    this.paymentService.getAnalytics(this.days(), this.projectId()).subscribe({
      next: (data) => this.data.set(data),
      error: (error) => {
        if (error.status === 403) this.notPro.set(true);
        else this.error.set(error.error?.message || 'No se pudieron cargar las estadísticas.');
      }
    });
  }

  changeProject(event: Event): void {
    this.projectId.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  changeDays(event: Event): void {
    this.days.set(Number((event.target as HTMLSelectElement).value));
    this.load();
  }

  shortDate(date: string): string {
    return new Date(date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
  }
}