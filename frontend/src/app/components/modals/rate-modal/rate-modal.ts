import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { RatingService } from '../../../services/rating.service';
import { Rating } from '../../../models/rating.model';
 
// M02 Calificar y comentar se abre desde 06
@Component({
  selector: 'app-rate-modal',
  templateUrl: './rate-modal.html',
  styleUrl: './rate-modal.css'
})
export class RateModal implements OnInit {
  projectId = input.required<string>();
  projectTitle = input.required<string>();
  myRating = input<Rating | null>(null);
  closed = output<void>();
  saved = output<string>();
 
  // Los 5 criterios en el mismo orden que pide el backend
  readonly criteria = [
    { name: 'Diseño e interfaz', question: '¿Se ve ordenado, claro y agradable?' },
    { name: 'Utilidad e impacto', question: '¿Resuelve un problema real o aporta algo?' },
    { name: 'Calidad técnica del código', question: '¿El código está organizado, es legible y sigue buenas prácticas?' },
    { name: 'Documentación (README)', question: '¿El README explica qué es, cómo instalarlo y usarlo?' },
    { name: 'Innovación y originalidad', question: '¿La idea o la forma de resolverla es novedosa?' }
  ];
  readonly values = [1, 2, 3, 4, 5];
 
  scores = signal([0, 0, 0, 0, 0]);
  commentLength = signal(0);
  error = signal('');
  sending = signal(false);
 
  complete = computed(() => this.scores().every(s => s > 0));
  average = computed(() => (this.complete() ? (this.scores().reduce((a, b) => a + b, 0) / 5).toFixed(1) : '—'));
 
  constructor(private ratingService: RatingService) {}
 
  ngOnInit(): void {
    // Si ya había calificado, se cargan sus estrellas
    const mine = this.myRating();
    if (mine) {
      this.scores.set([mine.scoreDesign, mine.scoreUsefulness, mine.scoreCodeQuality, mine.scoreDocumentation, mine.scoreInnovation]);
      this.commentLength.set(mine.comment?.length ?? 0);
    }
  }
 
  setScore(index: number, value: number): void {
    this.scores.update(list => list.map((s, i) => (i === index ? value : s)));
  }
 
  countComment(event: Event): void {
    this.commentLength.set((event.target as HTMLTextAreaElement).value.length);
  }
 
  submit(event: Event): void {
    event.preventDefault();
    if (!this.complete()) return;
 
    const data = new FormData(event.target as HTMLFormElement);
    const [design, usefulness, codeQuality, documentation, innovation] = this.scores();
    this.sending.set(true);
    this.error.set('');
 
    this.ratingService.rate(this.projectId(), {
      scoreDesign: design,
      scoreUsefulness: usefulness,
      scoreCodeQuality: codeQuality,
      scoreDocumentation: documentation,
      scoreInnovation: innovation,
      comment: (data.get('comment') as string).trim()
    }).subscribe({
      next: (response) => this.saved.emit(response.message),
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo guardar la calificación.');
      }
    });
  }
 
  deleteRating(): void {
    if (!confirm('¿Seguro que quieres borrar tu calificación?')) return;
    this.ratingService.deleteMyRating(this.projectId()).subscribe({
      next: (response) => this.saved.emit(response.message),
      error: (error) => this.error.set(error.error?.message || 'No se pudo borrar la calificación.')
    });
  }
}