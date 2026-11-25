import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../services/project.service';
import { MyProjectsResponse, OwnerProject } from '../../../models/project-detail.model';
import { formatDate, imageUrl, score } from '../../../utils/format';
import { AccountMenu } from '../../shared/account-menu/account-menu';
import { ProjectFormModal } from '../../modals/project-form-modal/project-form-modal';
import { DeleteProjectModal } from '../../modals/delete-project-modal/delete-project-modal';
import { BadgeModal } from '../../modals/badge-modal/badge-modal';
import { FeatureModal } from '../../modals/feature-modal/feature-modal';
import { ProPlanModal } from '../../modals/pro-plan-modal/pro-plan-modal';
 
// 09 Mi cuenta · Mis proyectos · ruta /my-account/projects
@Component({
  selector: 'app-my-projects',
  imports: [RouterLink, AccountMenu, ProjectFormModal, DeleteProjectModal, BadgeModal, FeatureModal, ProPlanModal],
  templateUrl: './my-projects.html',
  styleUrl: './my-projects.css'
})
export class MyProjects implements OnInit {
  data = signal<MyProjectsResponse | null>(null);
  loading = signal(true);
  error = signal('');
  message = signal('');
 
  // Ventanas modales: guardan el proyecto con el que se abrieron
  showForm = signal(false);
  editingId = signal<string | null>(null);
  deleting = signal<OwnerProject | null>(null);
  badgeFor = signal<OwnerProject | null>(null);
  featureFor = signal<OwnerProject | null>(null);
  showProPlan = signal(false);
 
  readonly score = score;
  readonly formatDate = formatDate;
  readonly imageUrl = imageUrl;
 
  constructor(private projectService: ProjectService, private route: ActivatedRoute, private router: Router) {}
 
  ngOnInit(): void {
    this.load();
    // El botón "+ Publicar proyecto" del encabezado llega con ?new=true
    if (this.route.snapshot.queryParamMap.get('new') === 'true') {
      this.openCreate();
      this.router.navigate([], { queryParams: {} });
    }
  }
 
  load(): void {
    this.projectService.getMyProjects().subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar tus proyectos.');
        this.loading.set(false);
      }
    });
  }
 
  openCreate(): void {
    this.editingId.set(null);
    this.showForm.set(true);
  }
 
  openEdit(project: OwnerProject): void {
    this.editingId.set(project.id);
    this.showForm.set(true);
  }
 
  // Después de guardar, borrar o cambiar algo se recarga la tabla y se muestra el mensaje del backend
  done(text: string): void {
    this.showForm.set(false);
    this.deleting.set(null);
    this.message.set(text);
    this.load();
  }
 
  toggleStatus(project: OwnerProject): void {
    const newStatus = project.status === 'published' ? 'deactivated' : 'published';
    this.projectService.changeStatus(project.id, newStatus).subscribe({
      next: (response) => this.done(response.message),
      error: (error) => this.message.set(error.error?.message || 'No se pudo cambiar el estado.')
    });
  }
 
  statusText(project: OwnerProject): string {
    if (project.status === 'published') return 'Publicado';
    if (project.status === 'deactivated') return 'Desactivado';
    return 'Oculto: ' + (project.hiddenReason || 'moderación');
  }
}