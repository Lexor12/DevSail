import { Component, computed, input, signal } from '@angular/core';
import { API_URL } from '../../../config/api';

// Insignia para el README con vista previa, código para copiar y botón
// La usan el detalle del proyecto, solo para el dueño, y la ventana de insignia
// La imagen la genera shields.io leyendo el promedio de la API, así se actualiza sola
// Funciona cuando el backend esté publicado porque shields.io no llega a localhost
@Component({
  selector: 'app-badge-snippet',
  templateUrl: './badge-snippet.html',
  styleUrl: './badge-snippet.css'
})
export class BadgeSnippet {
  projectId = input.required<string>();
  nickname = input.required<string>();
  average = input.required<string>();

  format = signal<'markdown' | 'html'>('markdown');
  copied = signal(false);

  private imageLink = computed(() =>
    'https://img.shields.io/badge/dynamic/json?color=F5B83D' +
    '&label=' + encodeURIComponent('DevSail ' + this.nickname()) +
    '&query=' + encodeURIComponent('$.project.avgOverall') +
    '&url=' + encodeURIComponent(`${API_URL}/projects/${this.projectId()}`)
  );

  private pageLink = computed(() => `${window.location.origin}/projects/${this.projectId()}`);

  code = computed(() =>
    this.format() === 'markdown'
      ? `[![DevSail](${this.imageLink()})](${this.pageLink()})`
      : `<a href="${this.pageLink()}"><img src="${this.imageLink()}" alt="DevSail"></a>`
  );

  copy(): void {
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
