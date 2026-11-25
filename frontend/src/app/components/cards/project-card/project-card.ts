import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectSummary } from '../../../models/project.model';
import { IMAGES_URL } from '../../../config/api';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink],
  templateUrl: './project-card.html',
  styleUrl: './project-card.css'
})
export class ProjectCard {
  project = input.required<ProjectSummary>();
  // En "Proyectos destacados" se muestra la etiqueta amarilla DESTACADO
  showFeatured = input(false);

  // Postgres manda el promedio como texto; lo pasamos a número
  average = computed(() => Number(this.project().avgOverall ?? 0));

  //Muestrra las estrellas según el promedio redondeado
  stars = computed(() => {
    const full = Math.round(this.average());
    return '★'.repeat(full) + '☆'.repeat(5 - full);//Estas estrellas las saque de internet xd, se que parece IA, pero Google las da, aqui esta la pagina https://emojicombos.com/estrella
  });

  cover = computed(() => {
    const path = this.project().coverPath;
    return path && IMAGES_URL ? IMAGES_URL + path : null;
  });
}