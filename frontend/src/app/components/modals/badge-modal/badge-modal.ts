import { Component, input, output } from '@angular/core';
import { BadgeSnippet } from '../../shared/badge-snippet/badge-snippet';

// Ventana de la insignia para el README, se abre con Copiar insignia
@Component({
  selector: 'app-badge-modal',
  imports: [BadgeSnippet],
  templateUrl: './badge-modal.html',
  styleUrl: './badge-modal.css'
})
export class BadgeModal {
  projectId = input.required<string>();
  nickname = input.required<string>();
  average = input.required<string>();
  closed = output<void>();
}
