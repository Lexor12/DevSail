import { Component,input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { ProjectCard } from '../../cards/project-card/project-card';
import { ProjectSummary } from '../../../models/project.model';

// Sección del inicio con título, contenido extra, enlace para ver todos y las tarjetas
@Component({
  selector: 'app-project-section',
  imports: [RouterLink, ProjectCard],
  templateUrl: './project-section.html',
  styleUrl: './project-section.css'
})
export class ProjectSection {
  title = input.required<string>();
  kind = input<'featured' | 'top-rated' | 'latest'>('latest');
  projects = input<ProjectSummary[]>([]);
  loading = input(false);
  // Parámetros del enlace para ver todos
  seeAll = input<Params | null>(null);
}