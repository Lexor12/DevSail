import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SearchBar } from '../../shared/search-bar/search-bar';
import { FilterPanel } from '../../shared/filter-panel/filter-panel';
import { ProjectSection } from '../../shared/project-section/project-section';
import { Tabs } from '../../shared/tabs/tabs';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';
import { ProjectSummary } from '../../../models/project.model';
import { formToQueryParams } from '../../../utils/filters';

//Este componente hace referencia al modulo de Inicio
@Component({
  selector: 'app-home',
  imports: [RouterLink, SearchBar, FilterPanel, ProjectSection, Tabs],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  featured = signal<ProjectSummary[]>([]);
  topRated = signal<ProjectSummary[]>([]);
  latest = signal<ProjectSummary[]>([]);
  loading = signal(true);
  loadingTopRated = signal(false);
  error = signal('');
  period = signal<'week' | 'month'>('week');

  readonly periods = [
    { value: 'week', text: 'Semana' },
    { value: 'month', text: 'Mes' }
  ];

  constructor(
    private projectService: ProjectService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectService.getHome(this.period()).subscribe({
      next: (data) => {
        this.featured.set(data.featured);
        this.topRated.set(data.topRated);
        this.latest.set(data.latest);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar los proyectos.');
        this.loading.set(false);
      }
    });
  }

  // Semana / Mes solo vuelve a pedir la sección de mejor valorados
  changePeriod(value: string): void {
    const period = value === 'month' ? 'month' : 'week';
    if (period === this.period()) return;
    this.period.set(period);
    this.loadingTopRated.set(true);

    this.projectService.getHome(period).subscribe({
      next: (data) => {
        this.topRated.set(data.topRated);
        this.loadingTopRated.set(false);
      },
      error: () => this.loadingTopRated.set(false)
    });
  }

  // El buscador y los filtros comparten un solo formulario; al enviarlo se abre /explore
  search(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    this.router.navigate(['/explore'], { queryParams: formToQueryParams(data) });
  }
}