import { Component, output, signal } from '@angular/core';
import { PaymentService } from '../../../services/payment.service';

//Modal para contratar el Plan Pro
@Component({
  selector: 'app-pro-plan-modal',
  templateUrl: './pro-plan-modal.html',
  styleUrl: './pro-plan-modal.css'
})
export class ProPlanModal {
  closed = output<void>();

  accepted = signal(false);
  sending = signal(false);
  error = signal('');

  constructor(private paymentService: PaymentService) {}

  toggleTerms(event: Event): void {
    this.accepted.set((event.target as HTMLInputElement).checked);
  }

  // Crea la orden y manda al usuario a PayPal, al terminar PayPal lo regresa a la app
  pay(): void {
    this.sending.set(true);
    this.error.set('');
    this.paymentService.createOrder('pro_plan', null).subscribe({
      next: (response) => (window.location.href = response.approveUrl),
      error: (error) => {
        this.sending.set(false);
        this.error.set(error.error?.message || 'No se pudo iniciar el pago.');
      }
    });
  }
}
