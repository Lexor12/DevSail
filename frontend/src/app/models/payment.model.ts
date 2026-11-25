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

// Respuesta con mi plan y mis pagos
export interface MyPayments {
    isPro: boolean;
    proEndsAt: string | null;
    payments: Payment[];
    prices: Record<PaymentConcept, Price>;
}

// Respuesta al crear una orden de PayPal
export interface OrderResponse {
    orderId: string;
    approveUrl: string;
}

// Estadísticas
export interface DailyVisits {
    date: string;// año, mes y día
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

// Respuesta de las estadísticas Pro
export interface Analytics {
    days: number;
    dailySeries: DailyVisits[];
    projectsBreakdown: ProjectVisits[];
}

// Es un pago normal con el usuario que lo hizo
export interface AdminPayment extends Payment {
    username: string | null;
}

export interface IncomeFilters {
    dateFrom: string;
    dateTo: string;
    concept: string;
    status: string;
    username: string;
    page: number;
}

export interface IncomeResponse {
    payments: AdminPayment[];
    total: number;
    summary: { completedAmount: number; completedCount: number };
    page: number;
    pageSize: number;
}