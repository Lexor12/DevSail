import { Component, OnDestroy, computed, effect, input, output, signal } from '@angular/core';

//Cuenta regresiva de minutos y segundos para los códigos, se reinicia cuando cambia restart
// Se usa para avisar cuánto falta para que venza el código o para poder reenviarlo
@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.html',
  styleUrl: './countdown.css'
})
export class Countdown implements OnDestroy {
  seconds = input.required<number>();
  // Cualquier cambio en este número vuelve a arrancar la cuenta
  restart = input(0);
  finished = output<void>();

  remaining = signal(0);
  text = computed(() => {
    const total = this.remaining();
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  private interval?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      this.restart();
      this.start(this.seconds());
    });
  }

  private start(seconds: number): void {
    clearInterval(this.interval);
    this.remaining.set(seconds);
    this.interval = setInterval(() => {
      if (this.remaining() <= 1) {
        this.remaining.set(0);
        clearInterval(this.interval);
        this.finished.emit();
        return;
      }
      this.remaining.update(s => s - 1);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}