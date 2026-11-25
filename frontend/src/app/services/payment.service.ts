import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { Analytics, MyPayments, OrderResponse, PaymentConcept } from '../models/payment.model';

type Message = { message: string };

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private api = `${API_URL}/payments`;

    constructor(private http: HttpClient) {}

    // 11 Plan y pagos: si es Pro, hasta cuándo, historial y precios
    getMyPayments(): Observable<MyPayments> {
        return this.http.get<MyPayments>(`${this.api}/me`);
    }

    // 12 Estadísticas (solo Plan Pro); projectId vacío = todos los proyectos
    getAnalytics(days: number, projectId: string): Observable<Analytics> {
        let params = new HttpParams().set('days', days);
        if (projectId) params = params.set('projectId', projectId);
        return this.http.get<Analytics>(`${this.api}/pro-analytics`, { params });
    }

    // M06 y M07: crea la orden y regresa la dirección de PayPal a donde hay que mandar al usuario
    createOrder(concept: PaymentConcept, projectId: string | null): Observable<OrderResponse> {
        return this.http.post<OrderResponse>(`${this.api}/paypal/create-order`, { concept, projectId });
    }

    // Pantalla de regreso: PayPal manda el id de la orden como ?token=...
    captureOrder(orderId: string): Observable<Message> {
        return this.http.post<Message>(`${this.api}/paypal/capture-order`, { orderId });
    }

    cancelOrder(orderId: string): Observable<Message> {
        return this.http.post<Message>(`${this.api}/paypal/cancel-order`, { orderId });
    }
}
