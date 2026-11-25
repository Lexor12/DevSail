import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';

//Pantalla a la que regresa PayPal después de un pago
// Sirve tanto para confirmarlo como para cancelarlo
@Component({
  selector: 'app-payment-result',
  imports: [RouterLink],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.css'
})
export class PaymentResult implements OnInit {
  state = signal<'loading' | 'success' | 'cancelled' | 'failed'>('loading');
  message = signal('');
  orderId = signal('');

  constructor(private route: ActivatedRoute, private paymentService: PaymentService) {}

  ngOnInit(): void {
    const mode = this.route.snapshot.data['mode'];
    const orderId = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.orderId.set(orderId);

    if (!orderId) {
      this.state.set('failed');
      return;
    }

    if (mode === 'cancel') {
      this.paymentService.cancelOrder(orderId).subscribe({
        next: () => this.state.set('cancelled'),
        error: () => this.state.set('cancelled')
      });
      return;
    }

    this.paymentService.captureOrder(orderId).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.state.set('success');
      },
      error: (error) => {
        this.message.set(error.error?.message || '');
        this.state.set('failed');
      }
    });
  }
}