import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../services/project.service';
import { RatingService } from '../../../services/rating.service';
import { AuthService } from '../../../services/auth.service';
import { ProjectDetailData } from '../../../models/project-detail.model';
import { Rating, RatingItem } from '../../../models/rating.model';
import { formatDate, imageUrl, initials, score, stars } from '../../../utils/format';
import { BadgeSnippet } from '../../shared/badge-snippet/badge-snippet';
import { RateModal } from '../../modals/rate-modal/rate-modal';
import { ReportModal } from '../../modals/report-modal/report-modal';
import { ImageViewer } from '../../modals/image-viewer/image-viewer';
import { FeatureModal } from '../../modals/feature-modal/feature-modal';
 
// 06 Detalle de proyecto · ruta /projects/:id
@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, BadgeSnippet, RateModal, ReportModal, ImageViewer, FeatureModal],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css'
})
export class ProjectDetail implements OnInit {
  project = signal<ProjectDetailData | null>(null);
  isOwner = signal(false);
  isSaved = signal(false);
  myRating = signal<Rating | null>(null);
  loading = signal(true);
  error = signal('');
  message = signal('');
 
  // Galería: imagen grande seleccionada
  selectedImage = signal(0);
 
  // Comentarios
  ratings = signal<RatingItem[]>([]);
  totalRatings = signal(0);
  ratingsPage = signal(1);
  ratingsSort = signal('recent');
 
  // Ventanas modales abiertas
  showRate = signal(false);
  showViewer = signal(false);
  showFeature = signal(false);
  report = signal<{ type: 'project' | 'comment'; id: string; label: string } | null>(null);
 
  // Funciones de utils/format para usarlas en el HTML
  readonly stars = stars;
  readonly score = score;
  readonly initials = initials;
  readonly formatDate = formatDate;
  readonly imageUrl = imageUrl;
 
  // Las 5 barras de "Calificaciones por criterio"
  criteria = computed(() => {
    const p = this.project();
    if (!p) return [];
    return [
      { name: 'Diseño e interfaz', value: Number(p.avgDesign ?? 0) },
      { name: 'Utilidad e impacto', value: Number(p.avgUsefulness ?? 0) },
      { name: 'Calidad técnica del código', value: Number(p.avgCodeQuality ?? 0) },
      { name: 'Documentación (README)', value: Number(p.avgDocumentation ?? 0) },
      { name: 'Innovación y originalidad', value: Number(p.avgInnovation ?? 0) }
    ];
  });
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private ratingService: RatingService,
    public authService: AuthService
  ) {}
 
  ngOnInit(): void {
    // Si cambia el id en la dirección (por ejemplo desde otro proyecto) se vuelve a cargar
    this.route.paramMap.subscribe(params => {
      this.loadProject(params.get('id') ?? '');
    });
  }
 
  loadProject(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.projectService.getDetail(id).subscribe({
      next: (response) => {
        this.project.set(response.project);
        this.isOwner.set(response.isOwner);
        this.isSaved.set(response.isSaved);
        this.myRating.set(response.myRating);
        this.selectedImage.set(0);
        this.loading.set(false);
        this.loadRatings(1);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudo cargar el proyecto.');
        this.loading.set(false);
      }
    });
  }
 
  // page 1 reemplaza la lista; las siguientes páginas se agregan al final ("Ver más comentarios")
  loadRatings(page: number): void {
    const id = this.project()?.id;
    if (!id) return;
    this.ratingService.getRatings(id, this.ratingsSort(), page).subscribe({
      next: (response) => {
        this.ratings.set(page === 1 ? response.ratings : [...this.ratings(), ...response.ratings]);
        this.totalRatings.set(response.total);
        this.ratingsPage.set(page);
      }
    });
  }
 
  changeSort(event: Event): void {
    this.ratingsSort.set((event.target as HTMLSelectElement).value);
    this.loadRatings(1);
  }
 
  // Guardar, calificar y reportar piden sesión
  private needsLogin(): boolean {
    if (!this.authService.user()) {
      this.router.navigate(['/auth/login']);
      return true;
    }
    return false;
  }
 
  toggleSave(): void {
    const p = this.project();
    if (!p || this.needsLogin()) return;
    this.ratingService.toggleSave(p.id).subscribe({
      next: (response) => {
        this.isSaved.set(response.saved);
        this.project.set({ ...p, savesCount: p.savesCount + (response.saved ? 1 : -1) });
        this.message.set(response.message);
      },
      error: (error) => this.message.set(error.error?.message || 'No se pudo guardar.')
    });
  }
 
  openRate(): void {
    if (this.needsLogin()) return;
    this.showRate.set(true);
  }
 
  openReport(type: 'project' | 'comment', id: string, label: string): void {
    if (this.needsLogin()) return;
    this.report.set({ type, id, label });
  }
 
  // Al publicar o borrar mi calificación se recarga todo para ver el nuevo promedio
  onRated(text: string): void {
    this.showRate.set(false);
    this.message.set(text);
    this.loadProject(this.project()!.id);
  }
 
  onReported(text: string): void {
    this.report.set(null);
    this.message.set(text);
  }
 
  openViewer(index: number): void {
    this.selectedImage.set(index);
    this.showViewer.set(true);
  }
 
  // "github" -> "GitHub" para el botón del repositorio
  platformName(platform: string): string {
    const names: Record<string, string> = { github: 'GitHub', gitlab: 'GitLab', bitbucket: 'Bitbucket' };
    return names[platform] ?? platform;
  }
 
  // Direcciones de las imágenes para el visor (null si aún no hay bucket configurado)
  imageUrls(): (string | null)[] {
    return (this.project()?.images ?? []).map(image => imageUrl(image.storagePath));
  }
}
