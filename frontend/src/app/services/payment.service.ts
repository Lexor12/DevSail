import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config/api';
import { Analytics, IncomeFilters, IncomeResponse, MyPayments, OrderResponse, PaymentConcept } from '../models/payment.model';

type Message = { message: string };

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private api = `${API_URL}/payments`;

    constructor(private http: HttpClient) {}

    // Plan, fecha de vencimiento, historial y precios
    getMyPayments(): Observable<MyPayments> {
        return this.http.get<MyPayments>(`${this.api}/me`);
    }

    // Estadísticas Pro, con projectId vacío son de todos los proyectos
    getAnalytics(days: number, projectId: string): Observable<Analytics> {
        let params = new HttpParams().set('days', days);
        if (projectId) params = params.set('projectId', projectId);
        return this.http.get<Analytics>(`${this.api}/pro-analytics`, { params });
    }

    // Crea la orden y regresa el enlace de PayPal
    createOrder(concept: PaymentConcept, projectId: string | null): Observable<OrderResponse> {
        return this.http.post<OrderResponse>(`${this.api}/paypal/create-order`, { concept, projectId });
    }

    // PayPal manda el id de la orden como token en la dirección
    captureOrder(orderId: string): Observable<Message> {
        return this.http.post<Message>(`${this.api}/paypal/capture-order`, { orderId });
    }

    cancelOrder(orderId: string): Observable<Message> {
        return this.http.post<Message>(`${this.api}/paypal/cancel-order`, { orderId });
    }

    // Ingresos para el administrador, solo se mandan los filtros con valor
    getIncome(filters: IncomeFilters): Observable<IncomeResponse> {
        let params = new HttpParams().set('page', filters.page).set('pageSize', 10);
        if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
        if (filters.concept) params = params.set('concept', filters.concept);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.username) params = params.set('username', filters.username);
        return this.http.get<IncomeResponse>(`${API_URL}/admin/income`, { params });
    }
}
