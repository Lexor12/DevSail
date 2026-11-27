import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { DashboardSummary } from '../../../models/admin.model';
//Este componente como tal muestra un panel de inicio para la sección de Administrador, aquí se muestra un resumen de reportes, comentarios, ingresos, etc
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  error = signal('');

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getDashboard().subscribe({
      next: (response) => {
        this.summary.set(response.summary);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudo cargar el resumen.');
        this.loading.set(false);
      }
    });
  }
  // Muestra el dinero como $1,234.00
  money(value: number): string {
    return '$' + Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}