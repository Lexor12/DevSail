import { Component, OnInit, input, output, signal } from '@angular/core';
import { ProjectService } from '../../../services/project.service';
import { CatalogService } from '../../../services/catalog.service';
import { ProjectType, Technology } from '../../../models/catalog.model';
import { ProjectDetailData, ProjectImage } from '../../../models/project-detail.model';
import { readFileAsBase64 } from '../../../utils/format';
 
const MAX_IMAGES = 4;
const MAX_IMAGE_MB = 2;
const MAX_TECHNOLOGIES = 5;
 
// Ventana para publicar o editar un proyecto
// Si projectId es null se publica uno nuevo y si trae id se edita
@Component({
  selector: 'app-project-form-modal',
  templateUrl: './project-form-modal.html',
  styleUrl: './project-form-modal.css'
})
export class ProjectFormModal implements OnInit {
  projectId = input<string | null>(null);
  closed = output<void>();
  saved = output<string>();
 
  types = signal<ProjectType[]>([]);
  technologies = signal<Technology[]>([]);
  project = signal<ProjectDetailData | null>(null);   // datos actuales al editar
 
  selectedTechs = signal<string[]>([]);
  techSearch = signal('');
  newImages = signal<string[]>([]);                     // imágenes nuevas en base64 al publicar
  currentImages = signal<ProjectImage[]>([]);           // imágenes que ya tiene al editar
 
  titleLength = signal(0);
  descriptionLength = signal(0);
  error = signal('');
  imageError = signal('');
  sending = signal(false);
 
  readonly maxTechs = MAX_TECHNOLOGIES;
 
  constructor(private projectService: ProjectService, private catalogService: CatalogService) {}
 
  ngOnInit(): void {
    this.catalogService.getProjectCatalogs().subscribe({
      next: (catalogs) => {
        this.types.set(catalogs.projectTypes);
        this.technologies.set(catalogs.technologies);
      }
    });
 
    // Al editar, se cargan los datos del proyecto para llenar el formulario
    const id = this.projectId();
    if (id) {
      this.projectService.getDetail(id).subscribe({
        next: (response) => {
          const p = response.project;
          this.project.set(p);
          this.selectedTechs.set(p.technologies.map(t => t.id));
          this.currentImages.set(p.images);
          this.titleLength.set(p.title.length);
          this.descriptionLength.set(p.description.length);
        },
        error: (error) => this.error.set(error.error?.message || 'No se pudo cargar el proyecto.')
      });
    }
  }
 
  isEditing(): boolean {
    return this.projectId() !== null;
  }
 
  count(event: Event, field: 'title' | 'description'): void {
    const length = (event.target as HTMLInputElement).value.length;
    if (field === 'title') this.titleLength.set(length);
    else this.descriptionLength.set(length);
  }
 
  // Tecnologías
 
  searchTech(event: Event): void {
    this.techSearch.set((event.target as HTMLInputElement).value.toLowerCase());
  }
 
  matches(technology: Technology): boolean {
    return technology.name.toLowerCase().includes(this.techSearch());
  }
 
  isSelected(id: string): boolean {
    return this.selectedTechs().includes(id);
  }
 
  toggleTech(event: Event, id: string): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked && this.selectedTechs().length >= MAX_TECHNOLOGIES) {
      checkbox.checked = false;
      return;
    }
    if (checkbox.checked) this.selectedTechs.update(list => [...list, id]);
    else this.selectedTechs.update(list => list.filter(t => t !== id));
  }
 
  techName(id: string): string {
    return this.technologies().find(t => t.id === id)?.name ?? '';
  }
 
  // Imágenes
 
  totalImages(): number {
    return this.isEditing() ? this.currentImages().length : this.newImages().length;
  }
 
  async pickImages(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement;
    const files = Array.from(fileInput.files ?? []);
    fileInput.value = '';
    this.imageError.set('');
 
    for (const file of files) {
      if (this.totalImages() >= MAX_IMAGES) {
        this.imageError.set(`Máximo ${MAX_IMAGES} imágenes.`);
        break;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.imageError.set(`«${file.name}» no es jpg, png o webp.`);
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        this.imageError.set(`«${file.name}» pesa más de ${MAX_IMAGE_MB} MB.`);
        continue;
      }
 
      const base64 = await readFileAsBase64(file);
      if (this.isEditing()) {
        // Al editar, cada imagen nueva se sube de inmediato
        this.projectService.addImage(this.projectId()!, base64).subscribe({
          next: () => this.reloadImages(),
          error: (error) => this.imageError.set(error.error?.message || 'No se pudo subir la imagen.')
        });
      } else {
        this.newImages.update(list => [...list, base64]);
      }
    }
  }
 
  removeNewImage(index: number): void {
    this.newImages.update(list => list.filter((_, i) => i !== index));
  }
 
  removeCurrentImage(image: ProjectImage): void {
    this.projectService.deleteImage(this.projectId()!, image.id).subscribe({
      next: () => this.reloadImages(),
      error: (error) => this.imageError.set(error.error?.message || 'No se pudo quitar la imagen.')
    });
  }
 
  private reloadImages(): void {
    this.projectService.getDetail(this.projectId()!).subscribe({
      next: (response) => this.currentImages.set(response.project.images)
    });
  }
 
  // Guardar
 
  submit(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    this.error.set('');
 
    if (this.selectedTechs().length === 0) {
      this.error.set('Elige al menos 1 tecnología.');
      return;
    }
    if (!this.isEditing() && this.newImages().length === 0) {
      this.error.set('Sube al menos 1 imagen.');
      return;
    }
 
    const project = {
      projectTypeId: data.get('projectTypeId') as string,
      title: (data.get('title') as string).trim(),
      nickname: (data.get('nickname') as string).trim(),
      description: (data.get('description') as string).trim(),
      repositoryUrl: (data.get('repositoryUrl') as string).trim(),
      demoUrl: (data.get('demoUrl') as string).trim(),
      seekingFeedback: data.get('seekingFeedback') === 'on',
      openToCollaborate: data.get('openToCollaborate') === 'on',
      technologyIds: this.selectedTechs()
    };
 
    this.sending.set(true);
    const request = this.isEditing()
      ? this.projectService.update(this.projectId()!, project)
      : this.projectService.create({ ...project, authorshipDeclared: data.get('authorship') === 'on', images: this.newImages() });
 
    request.subscribe({
      next: (response) => this.saved.emit(response.message),
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo guardar el proyecto.');
      }
    });
  }
}