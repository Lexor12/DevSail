import { Component, OnInit, signal } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { MyAccount } from '../../../models/user.model';
import { initials, readFileAsBase64 } from '../../../utils/format';
import { AccountMenu } from '../../shared/account-menu/account-menu';

//Sección de Mi cuenta con los datos y la seguridad
@Component({
  selector: 'app-account-data',
  imports: [AccountMenu],
  templateUrl: './account-data.html',
  styleUrl: './account-data.css'
})
export class AccountData implements OnInit {
  account = signal<MyAccount | null>(null);
  nameLength = signal(0);
  bioLength = signal(0);

  profileMessage = signal('');
  profileError = signal('');
  avatarError = signal('');
  passwordMessage = signal('');
  passwordError = signal('');
  saving = signal(false);

  readonly initials = initials;

  // Enlaces opcionales del perfil con su nombre, etiqueta y ejemplo
  readonly links = [
    { name: 'linkLinkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…' },
    { name: 'linkWebsite', label: 'Sitio personal', placeholder: 'https://…' },
    { name: 'linkGithub', label: 'GitHub', placeholder: 'https://github.com/…' },
    { name: 'linkGitlab', label: 'GitLab', placeholder: 'https://gitlab.com/…' },
    { name: 'linkBitbucket', label: 'Bitbucket', placeholder: 'https://bitbucket.org/…' },
    { name: 'linkInstagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
    { name: 'linkYoutube', label: 'YouTube', placeholder: 'https://youtube.com/…' }
  ] as const;

  constructor(private userService: UserService, private authService: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.userService.getMyAccount().subscribe({
      next: (account) => {
        this.account.set(account);
        this.nameLength.set(account.fullName.length);
        this.bioLength.set(account.bio?.length ?? 0);
      },
      error: (error) => this.profileError.set(error.error?.message || 'No se pudieron cargar tus datos.')
    });
  }

  maskedEmail(): string {
    const [user, domain] = (this.account()?.email ?? '').split('@');
    return user && domain ? `${user[0]}•••••@${domain}` : '';
  }

  count(event: Event, field: 'name' | 'bio'): void {
    const length = (event.target as HTMLInputElement).value.length;
    if (field === 'name') this.nameLength.set(length);
    else this.bioLength.set(length);
  }

  // Foto
  async changePhoto(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    fileInput.value = '';
    this.avatarError.set('');
    if (!file) return;

    if (file.size > 1024 * 1024) {
      this.avatarError.set('La foto pesa más de 1 MB.');
      return;
    }

    const image = await readFileAsBase64(file);
    this.userService.updateAvatar(image).subscribe({
      next: () => this.load(),
      error: (error) => this.avatarError.set(error.error?.message || 'No se pudo cambiar la foto.')
    });
  }

  removePhoto(): void {
    this.userService.removeAvatar().subscribe({
      next: () => this.load(),
      error: (error) => this.avatarError.set(error.error?.message || 'No se pudo quitar la foto.')
    });
  }

  // Datos del perfil

  saveProfile(event: Event): void {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const text = (name: string) => ((data.get(name) as string) ?? '').trim();

    this.profileMessage.set('');
    this.profileError.set('');
    this.saving.set(true);

    this.userService.updateProfile({
      fullName: text('fullName'),
      username: text('username').toLowerCase(),
      bio: text('bio'),
      linkLinkedin: text('linkLinkedin'),
      linkWebsite: text('linkWebsite'),
      linkGithub: text('linkGithub'),
      linkGitlab: text('linkGitlab'),
      linkBitbucket: text('linkBitbucket'),
      linkInstagram: text('linkInstagram'),
      linkYoutube: text('linkYoutube')
    }).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.profileMessage.set(response.message);
        // El encabezado y el perfil usan el usuario de la sesión, así que se actualiza
        this.authService.loadSession();
      },
      error: (error) => {
        this.saving.set(false);
        this.profileError.set(error.error?.message || 'No se pudieron guardar los cambios.');
      }
    });
  }

  // Contraseña
  changePassword(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    this.passwordMessage.set('');
    this.passwordError.set('');

    this.userService.changePassword({
      currentPassword: data.get('currentPassword') as string,
      newPassword: data.get('newPassword') as string,
      confirmPassword: data.get('confirmPassword') as string
    }).subscribe({
      next: (response) => {
        this.passwordMessage.set(response.message);
        form.reset();
      },
      error: (error) => this.passwordError.set(error.error?.message || 'No se pudo cambiar la contraseña.')
    });
  }
}