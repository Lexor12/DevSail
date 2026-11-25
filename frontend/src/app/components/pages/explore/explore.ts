import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SearchBar } from '../../shared/search-bar/search-bar';
import { FilterPanel } from '../../shared/filter-panel/filter-panel';
import { ActiveFilter, ActiveFilters } from '../../shared/active-filters/active-filters';
import { Paginator } from '../../shared/paginator/paginator';
import { ProjectCard } from '../../cards/project-card/project-card';
import { ProjectService } from '../../../services/project.service';
import { CatalogService } from '../../../services/catalog.service';
import { SearchFilters, SearchResult } from '../../../models/project.model';
import { ProjectType, Technology } from '../../../models/catalog.model';
import { EMPTY_FILTERS, formToQueryParams, queryParamsToFilters } from '../../../utils/filters';
 
// 02 Resultados de búsqueda · ruta /explore
// Todos los filtros viven en la dirección (/explore?q=...&type=...), así se pueden compartir y recargar
@Component({
  selector: 'app-explore',
  imports: [SearchBar, FilterPanel, ActiveFilters, Paginator, ProjectCard],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore implements OnInit {
  filters = signal<SearchFilters>(EMPTY_FILTERS);
  result = signal<SearchResult | null>(null);
  loading = signal(true);
  error = signal('');
 
  private types = signal<ProjectType[]>([]);
  private technologies = signal<Technology[]>([]);
 
  readonly sortOptions = [
    { value: 'recent', text: 'Más recientes' },
    { value: 'rated', text: 'Mejor calificados' },
    { value: 'saved', text: 'Más guardados' }
  ];
 
  // Chips de "filtros activos" armados a partir de los filtros de la dirección
  activeFilters = computed<ActiveFilter[]>(() => {
    const f = this.filters();
    const list: ActiveFilter[] = [];
    if (f.type) {
      const type = this.types().find(t => t.code === f.type);
      list.push({ key: 'type', text: type?.name ?? f.type });
    }
    for (const id of f.technologies) {
      const technology = this.technologies().find(t => t.id === id);
      list.push({ key: 'technologies', value: id, text: technology?.name ?? 'Tecnología' });
    }
    if (f.minRating > 0 || f.maxRating < 5) {
      list.push({ key: 'rating', text: `Calificación ${f.minRating}–${f.maxRating}` });
    }
    if (f.feedback) list.push({ key: 'feedback', text: 'Busco retroalimentación' });
    if (f.collaborate) list.push({ key: 'collaborate', text: 'Abierto a colaborar' });
    if (f.demo) list.push({ key: 'demo', text: 'Con demostración' });
    if (f.featured) list.push({ key: 'featured', text: 'Solo destacados' });
    return list;
  });
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private catalogService: CatalogService
  ) {}
 
  ngOnInit(): void {
    this.catalogService.getProjectCatalogs().subscribe({
      next: (catalogs) => {
        this.types.set(catalogs.projectTypes);
        this.technologies.set(catalogs.technologies);
      }
    });
 
    // Cada vez que cambia la dirección se vuelve a buscar
    this.route.queryParamMap.subscribe(params => {
      const filters = queryParamsToFilters(params);
      this.filters.set(filters);
      this.search(filters);
    });
  }
 
  private search(filters: SearchFilters): void {
    this.loading.set(true);
    this.error.set('');
    this.projectService.search(filters).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudo hacer la búsqueda.');
        this.result.set(null);
        this.loading.set(false);
      }
    });
  }
 
  // Botón Buscar, Aplicar filtros o cambio de orden: se lee todo el formulario con FormData
  apply(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const params = formToQueryParams(data);
    if (this.filters().pageSize !== 12) params['pageSize'] = this.filters().pageSize;
    this.router.navigate(['/explore'], { queryParams: params });
  }
 
  changeSort(event: Event): void {
    (event.target as HTMLSelectElement).form?.requestSubmit();
  }
 
  removeFilter(filter: ActiveFilter): void {
    const params: Params = { ...this.route.snapshot.queryParams, page: null };
    if (filter.key === 'technologies') {
      const rest = this.filters().technologies.filter(id => id !== filter.value);
      params['technologies'] = rest.length > 0 ? rest.join(',') : null;
    } else if (filter.key === 'rating') {
      params['minRating'] = null;
      params['maxRating'] = null;
    } else {
      params[filter.key] = null;
    }
    this.router.navigate(['/explore'], { queryParams: params });
  }
 
  // Quita todos los filtros pero conserva el texto buscado
  clearFilters(): void {
    const q = this.filters().q;
    this.router.navigate(['/explore'], { queryParams: q ? { q } : {} });
  }
 
  changePage(page: number): void {
    this.router.navigate(['/explore'], { queryParams: { page }, queryParamsHandling: 'merge' });
  }
 
  changePageSize(pageSize: number): void {
    this.router.navigate(['/explore'], { queryParams: { pageSize, page: null }, queryParamsHandling: 'merge' });
  }
}