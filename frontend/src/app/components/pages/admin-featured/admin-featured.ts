import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModerationService } from '../../../services/moderation.service';
import { FeaturedItem } from '../../../models/moderation.model';
import { formatDate } from '../../../utils/format';
//Este componente muestra los destacados y permite ocultarlos mediante motivo, este es solo del administrador al igual que todos los componentes que inician con admin"
@Component({
  selector: 'app-admin-featured',
  imports: [RouterLink],
  templateUrl: './admin-featured.html',
  styleUrl: './admin-featured.css'
})
export class AdminFeatured implements OnInit {
  activeList = signal<FeaturedItem[]>([]);
  endingSoon = signal<FeaturedItem[]>([]);
  loading = signal(true);
  error = signal('');
  message = signal('');

  // Destacado que se va a retirar, abre la caja del motivo
  removing = signal<FeaturedItem | null>(null);
  reason = signal('');
  sending = signal(false);

  readonly formatDate = formatDate;

  constructor(private moderationService: ModerationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.moderationService.getFeatured().subscribe({
      next: (response) => {
        this.activeList.set(response.activeList);
        this.endingSoon.set(response.endingSoon);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'No se pudieron cargar los destacados.');
        this.loading.set(false);
      }
    });
  }

  openRemove(item: FeaturedItem): void {
    this.removing.set(item);
    this.reason.set('');
    this.error.set('');
  }

  typeReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  confirmRemove(): void {
    const item = this.removing();
    if (!item) return;
    if (this.reason().trim().length < 10) {
      this.error.set('Escribe un motivo de al menos 10 caracteres.');
      return;
    }
    this.sending.set(true);
    this.moderationService.removeFeatured(item.projectId, this.reason().trim()).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.removing.set(null);
        this.sending.set(false);
        this.load();
      },
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo retirar el destacado.');
      }
    });
  }

  // Horas que le quedan, para la lista de los que están por terminar
  hoursLeft(endsAt: string): number {
    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / (60 * 60 * 1000)));
  }
}

