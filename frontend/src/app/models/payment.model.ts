// Conceptos de pago que acepta el backend
export type PaymentConcept = 'pro_plan' | 'featured_7' | 'featured_30';

export interface Payment {
    id: string;
    concept: PaymentConcept;
    projectId: string | null;
    projectNickname: string | null;
    amount: number;
    currency: string;
    paypalOrderId: string;
    status: 'pending' | 'completed' | 'cancelled' | 'failed' | 'refunded';
    createdAt: string;
    completedAt: string | null;
}

export interface Price {
    amount: number;
    days: number;
    label: string;
}

// Respuesta de GET /api/payments/me
export interface MyPayments {
    isPro: boolean;
    proEndsAt: string | null;
    payments: Payment[];
    prices: Record<PaymentConcept, Price>;
}

// Respuesta de POST /api/payments/paypal/create-order
export interface OrderResponse {
    orderId: string;
    approveUrl: string;
}

// ---------- Estadísticas (12) ----------

export interface DailyVisits {
    date: string;     // "2026-11-14"
    visits: number;
}

export interface ProjectVisits {
    projectId: string;
    title: string;
    nickname: string;
    visits7d: number;
    visits30d: number;
    totalVisits: number;
    savesCount: number;
    ratingsCount: number;
}

// Respuesta de GET /api/payments/pro-analytics
export interface Analytics {
    days: number;
    dailySeries: DailyVisits[];
    projectsBreakdown: ProjectVisits[];
}
