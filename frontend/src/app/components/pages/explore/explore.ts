import { Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
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

// Pantalla de resultados de búsqueda
// Los filtros viven en la dirección, así se pueden compartir y recargar
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
  private panel = viewChild.required(FilterPanel);
  private destroyRef = inject(DestroyRef);

  readonly sortOptions = [
    { value: 'recent', text: 'Más recientes' },
    { value: 'rated', text: 'Mejor calificados' },
    { value: 'saved', text: 'Más guardados' }
  ];
  // Etiquetas de filtros activos armadas con lo que trae la dirección
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
    // switchMap cancela la búsqueda anterior para que no pise a la nueva
    this.route.queryParamMap.pipe(
      map(params => queryParamsToFilters(params)),
      tap(filters => {
        this.filters.set(filters);
        this.loading.set(true);
        this.error.set('');
      }),
      switchMap(filters => this.search(filters)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => this.showResult(result));
  }

  // El error se atrapa aquí para que las siguientes búsquedas sigan funcionando
  private search(filters: SearchFilters): Observable<SearchResult | null> {
    return this.projectService.search(filters).pipe(
      catchError(error => {
        this.error.set(error.error?.message || 'No se pudo hacer la búsqueda.');
        return of(null);
      })
    );
  }

  private showResult(result: SearchResult | null): void {
    // Si la página pedida ya no existe se regresa a la primera
    if (result && result.projects.length === 0 && this.filters().page > 1) {
      this.router.navigate(['/explore'], { queryParams: { page: null }, queryParamsHandling: 'merge', replaceUrl: true });
      return;
    }
    this.result.set(result);
    this.loading.set(false);
  }

  // Al buscar, aplicar filtros o cambiar el orden se lee todo el formulario
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
    this.panel().reset();
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

  // Quita los filtros pero conserva el texto buscado
  clearFilters(): void {
    // Hace falta porque si la dirección no cambia el panel no se actualiza solo
    this.panel().reset();
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