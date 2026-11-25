import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RatingService } from '../../../services/rating.service';
import { ProjectSummary } from '../../../models/project.model';
import { AccountMenu } from '../../shared/account-menu/account-menu';
import { ProjectCard } from '../../cards/project-card/project-card';

// Pantalla de proyectos guardados
@Component({
  selector: 'app-saved',
  imports: [RouterLink, AccountMenu, ProjectCard],
  templateUrl: './saved.html',
  styleUrl: './saved.css'
})
export class Saved implements OnInit {
  projects = signal<ProjectSummary[]>([]);
  loading = signal(true);
  error = signal('');
  sort = 'recent';

  constructor(private ratingService: RatingService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.ratingService.getSaved(this.sort).subscribe({
      next: (response) => {
        this.projects.set(response.projects);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar tus guardados.');
        this.loading.set(false);
      }
    });
  }

  changeSort(event: Event): void {
    this.sort = (event.target as HTMLSelectElement).value;
    this.load();
  }

  // Quitar usa el mismo endpoint que guardar y luego se saca de la lista
  remove(project: ProjectSummary): void {
    this.ratingService.toggleSave(project.id).subscribe({
      next: () => this.projects.update(list => list.filter(p => p.id !== project.id))
    });
  }
}
