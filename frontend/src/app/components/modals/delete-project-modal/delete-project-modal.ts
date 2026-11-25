import { Component, input, output, signal } from '@angular/core';
import { ProjectService } from '../../../services/project.service';
import { OwnerProject } from '../../../models/project-detail.model';
import { formatDate } from '../../../utils/format';
 
// M08 Eliminar proyecto · se abre desde 09
@Component({
  selector: 'app-delete-project-modal',
  templateUrl: './delete-project-modal.html',
  styleUrl: './delete-project-modal.css'
})
export class DeleteProjectModal {
  project = input.required<OwnerProject>();
  closed = output<void>();
  deleted = output<string>();
 
  // El botón se activa cuando escribe el apodo exacto
  typed = signal('');
  error = signal('');
  sending = signal(false);
 
  readonly formatDate = formatDate;
 
  constructor(private projectService: ProjectService) {}
 
  type(event: Event): void {
    this.typed.set((event.target as HTMLInputElement).value.trim());
  }
 
  confirmDelete(): void {
    this.sending.set(true);
    this.projectService.delete(this.project().id).subscribe({
      next: (response) => this.deleted.emit(response.message),
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo eliminar el proyecto.');
      }
    });
  }
}