import { Component, ElementRef, afterNextRender, computed, output, signal, viewChild } from '@angular/core';

//Este componente hace referencia a las 6 casillas que se solicitan para el código que llega por correo (Ya sea verificacion de correo o perdida de contraseña). Avanza solo al escribir, regresa con Borrar
//y acepta pegar el código completo. Además deja un campo oculto "code" para que
//la página lo lea con FormData al enviar su formulario.
@Component({
  selector: 'app-code-input',
  templateUrl: './code-input.html',
  styleUrl: './code-input.css'
})
export class CodeInput {
  digits = signal<string[]>(['', '', '', '', '', '']);
  code = computed(() => this.digits().join(''));
  changed = output<string>();
  private container = viewChild.required<ElementRef<HTMLElement>>('container');

  constructor() {
    // Al abrir la pantalla el cursor queda en la primera casilla
    afterNextRender(() => this.boxes()[0]?.focus());
  }

  type(event: Event, index: number): void {
    const box = event.target as HTMLInputElement;
    const digit = box.value.replace(/\D/g, '').slice(-1);
    box.value = digit;
    this.digits.update(list => list.map((d, i) => (i === index ? digit : d)));
    this.changed.emit(this.code());

    if (digit) {
      this.boxes()[index + 1]?.focus();
    }
  }

  keyDown(event: KeyboardEvent, index: number): void {
    const box = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !box.value) {
      this.boxes()[index - 1]?.focus();
    }
  }

  paste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;

    const boxes = this.boxes();
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) {
      newDigits[i] = text[i];
      boxes[i].value = text[i];
    }
    this.digits.set(newDigits);
    this.changed.emit(this.code());
    boxes[Math.min(text.length, 5)].focus();
  }

  // La página lo llama después de un código incorrecto o al pedir uno nuevo
  reset(): void {
    this.boxes().forEach(box => (box.value = ''));
    this.digits.set(['', '', '', '', '', '']);
    this.changed.emit('');
    this.boxes()[0]?.focus();
  }

  private boxes(): HTMLInputElement[] {
    return Array.from(this.container().nativeElement.querySelectorAll<HTMLInputElement>('input.digit'));
  }
}
