import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { ProfileInfo, ProfileStats } from '../../../models/user.model';
import { ProjectSummary } from '../../../models/project.model';
import { initials, score } from '../../../utils/format';
import { ProjectCard } from '../../cards/project-card/project-card';

// Pantalla de perfil público
@Component({
  selector: 'app-public-profile',
  imports: [RouterLink, ProjectCard],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.css'
})
export class PublicProfile implements OnInit {
  profile = signal<ProfileInfo | null>(null);
  stats = signal<ProfileStats | null>(null);
  projects = signal<ProjectSummary[]>([]);
  error = signal('');
  username = '';
  sort = 'recent';

  readonly initials = initials;
  readonly score = score;

  // Solo los enlaces que llenó la persona
  links = computed(() => {
    const p = this.profile();
    if (!p) return [];
    const list = [
      { name: 'GitHub', url: p.linkGithub },
      { name: 'GitLab', url: p.linkGitlab },
      { name: 'Bitbucket', url: p.linkBitbucket },
      { name: 'LinkedIn', url: p.linkLinkedin },
      { name: 'Sitio personal', url: p.linkWebsite },
      { name: 'Instagram', url: p.linkInstagram },
      { name: 'YouTube', url: p.linkYoutube }
    ];
    return list.filter(link => link.url);
  });

  constructor(private route: ActivatedRoute, private userService: UserService, public authService: AuthService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.username = params.get('username') ?? '';
      this.load();
    });
  }

  load(): void {
    this.userService.getPublicProfile(this.username, this.sort).subscribe({
      next: (response) => {
        this.profile.set(response.profile);
        this.stats.set(response.stats);
        this.projects.set(response.projects);
      },
      error: (error) => this.error.set(error.error?.message || 'No se pudo cargar el perfil.')
    });
  }

  changeSort(event: Event): void {
    this.sort = (event.target as HTMLSelectElement).value;
    this.load();
  }

  // Por ejemplo noviembre de 2026
  memberSince(date: string): string {
    return new Date(date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  // Muestra el enlace sin el https del principio
  shortLink(url: string | null): string {
    return (url ?? '').replace('https://', '').replace('www.', '');
  }
}
