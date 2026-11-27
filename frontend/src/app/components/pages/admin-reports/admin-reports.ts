import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { ReportFilters, ReportListItem, ReportStatus } from '../../../models/admin.model';
import { formatDate } from '../../../utils/format';

//Este componente es para mostrarle al administrador lo que vienen siendo los reportes hechos pr usuarios
@Component({
  selector: 'app-admin-reports',
  imports: [RouterLink],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css'
})
export class AdminReports implements OnInit {
  reports = signal<ReportListItem[]>([]);
  total = signal(0);
  filters = signal<ReportFilters>({ status: 'pending', targetType: '', page: 1 });
  loading = signal(true);
  error = signal('');

  readonly pageSize = 10;
  readonly formatDate = formatDate;

  // Número de la última página para saber si hay "Siguiente"
  lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  constructor(private route: ActivatedRoute, private adminService: AdminService) {}

  ngOnInit(): void {
    // Si viene del resumen con ?status=pending, empieza con ese filtro
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status !== null) {
      this.filters.update(f => ({ ...f, status }));
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.adminService.getReports(this.filters()).subscribe({
      next: (response) => {
        this.reports.set(response.reports);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar los reportes.');
        this.loading.set(false);
      }
    });
  }

  // Lee los filtros del formulario y regresa a la página 1
  applyFilters(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    this.filters.set({
      status: (data.get('status') as string) || '',
      targetType: (data.get('targetType') as string) || '',
      page: 1
    });
    this.load();
  }

  changePage(page: number): void {
    this.filters.update(f => ({ ...f, page }));
    this.load();
  }

  statusText(status: ReportStatus): string {
    if (status === 'pending') return 'Pendiente';
    if (status === 'resolved_hidden') return 'Contenido oculto';
    return 'Descartado';
  }
}