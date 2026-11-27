import { Component, ElementRef, OnInit, computed, input, linkedSignal, output, signal } from '@angular/core';
import { CatalogService } from '../../../services/catalog.service';
import { ProjectType, Technology } from '../../../models/catalog.model';
import { SearchFilters } from '../../../models/project.model';
import { EMPTY_FILTERS, MAX_TECHNOLOGIES } from '../../../utils/filters';
 
// Panel de filtros reutilizable
// El modo horizontal es la fila debajo del buscador del inicio
// y el modo sidebar es la columna izquierda de los resultados
// Igual que el buscador no tiene form propio, sus campos tienen name
// y la página los lee con FormData al enviar su formulario
@Component({
  selector: 'app-filter-panel',
  imports: [],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css'
})
export class FilterPanel implements OnInit {
  mode = input<'horizontal' | 'sidebar'>('horizontal');
  filters = input<SearchFilters>(EMPTY_FILTERS);
  clear = output<void>();
 
  types = signal<ProjectType[]>([]);
  technologies = signal<Technology[]>([]);
 
  // Se reinician solos cada vez que cambian los filtros que manda la página
  selected = linkedSignal(() => this.filters().technologies);
  minRating = linkedSignal(() => this.filters().minRating);
  maxRating = linkedSignal(() => this.filters().maxRating);
 
  techSearch = signal('');
  maxWarning = signal(false);
 
  readonly max = MAX_TECHNOLOGIES;
  readonly steps = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  readonly sortOptions = [
    { value: 'recent', text: 'Más recientes' },
    { value: 'rated', text: 'Mejor calificados' },
    { value: 'saved', text: 'Más guardados' }
  ];
 
  // Tecnologías marcadas para las etiquetas del panel lateral
  selectedTechnologies = computed(() =>
    this.technologies().filter(t => this.selected().includes(t.id))
  );
 
  constructor(private catalogService: CatalogService, private host: ElementRef<HTMLElement>) {}
  ngOnInit(): void {
    this.catalogService.getProjectCatalogs().subscribe({
      next: (catalogs) => {
        this.types.set(catalogs.projectTypes);
        this.technologies.set(catalogs.technologies);
      },
      error: (error) => console.error('No se pudieron cargar los catálogos', error)
    });
  }
  // Descarta lo marcado sin aplicar y deja los controles como los filtros actuales
  reset(): void {
    const filters = this.filters();
    this.selected.set(filters.technologies);
    this.minRating.set(filters.minRating);
    this.maxRating.set(filters.maxRating);
    this.maxWarning.set(false);

    // El tipo y las etiquetas no tienen signal propia, así que se cambian directo
    const panel = this.host.nativeElement;
    const type = panel.querySelector<HTMLSelectElement>('select[name="type"]');
    if (type) type.value = filters.type;
    for (const name of ['feedback', 'collaborate', 'demo', 'featured'] as const) {
      const checkbox = panel.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (checkbox) checkbox.checked = filters[name];
    }
  }
  isSelected(id: string): boolean {
    return this.selected().includes(id);
  }
  // Esconde las tecnologías que no coinciden sin quitarlas del formulario
  matches(technology: Technology): boolean {
    return technology.name.toLowerCase().includes(this.techSearch().toLowerCase());
  }
  searchTechnology(event: Event): void {
    this.techSearch.set((event.target as HTMLInputElement).value);
  }
  toggleTechnology(event: Event, id: string): void {
    const checkbox = event.target as HTMLInputElement;
    this.maxWarning.set(false);
 
    if (checkbox.checked) {
      // Máximo 5 tecnologías, si ya hay 5 se desmarca la casilla y se avisa
      if (this.selected().length >= this.max) {
        checkbox.checked = false;
        this.maxWarning.set(true);
        return;
      }
      this.selected.update(list => [...list, id]);
    } else {
      this.selected.update(list => list.filter(t => t !== id));
    }
  }
  removeTechnology(id: string): void {
    this.selected.update(list => list.filter(t => t !== id));
  }
  changeRating(event: Event, end: 'min' | 'max'): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (end === 'min') this.minRating.set(value);
    else this.maxRating.set(value);
  }
}