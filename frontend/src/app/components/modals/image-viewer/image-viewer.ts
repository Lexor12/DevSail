import { Component, OnInit, input, output, signal } from '@angular/core';

// Visor que se abre al hacer clic en la imagen grande del detalle
@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.html',
  styleUrl: './image-viewer.css'
})
export class ImageViewer implements OnInit {
  // Direcciones de las imágenes, null si todavía no hay bucket configurado
  images = input.required<(string | null)[]>();
  start = input(0);
  closed = output<void>();

  index = signal(0);

  ngOnInit(): void {
    this.index.set(this.start());
  }

  previous(): void {
    this.index.set(this.index() === 0 ? this.images().length - 1 : this.index() - 1);
  }

  next(): void {
    this.index.set(this.index() === this.images().length - 1 ? 0 : this.index() + 1);
  }
}
