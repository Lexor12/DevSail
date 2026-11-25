import { Component,input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { ProjectCard } from '../../cards/project-card/project-card';
import { ProjectSummary } from '../../../models/project.model';

// Este componente refiere a la sección del inicio, la cual contiene título, contenido extra (chip, pestañas, texto), "Ver todos" y rejilla de tarjetas
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
  // Parámetros para el enlace "Ver todos" hacia /explore
  seeAll = input<Params | null>(null);
}