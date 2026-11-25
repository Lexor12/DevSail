import { Component, input, output } from '@angular/core';
import { BadgeSnippet } from '../../shared/badge-snippet/badge-snippet';

// M12 Insignia README · se abre desde 09 ("Copiar insignia")
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
