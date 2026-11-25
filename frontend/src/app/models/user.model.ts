
//Esta clase refiere al usuario, guarda sus datos y permite procesar los detalles del mismo, el que se encuentra activo
export interface User {
    id: string;
    fullName: string;
    username: string;
    email?: string;
    role: 'developer' | 'admin';
    avatarPath?: string | null;
}

// Respuesta de login y verify-email
export interface SessionResponse {
    message: string;
    user: User;
}

// Cuerpo que espera POST /api/auth/register
export interface RegisterData {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptPrivacy: boolean;
    acceptTerms: boolean;
}

// Perfil público
export interface ProfileInfo {
    id: string;
    fullName: string;
    username: string;
    bio: string | null;
    avatarPath: string | null;
    linkLinkedin: string | null;
    linkWebsite: string | null;
    linkGithub: string | null;
    linkGitlab: string | null;
    linkBitbucket: string | null;
    linkInstagram: string | null;
    linkYoutube: string | null;
    isPro: boolean;
    createdAt: string;
}

export interface ProfileStats {
    publishedProjects: number;
    avgRating: number | string | null;
    ratingsReceived: number;
    savesReceived: number;
    ratingsGiven: number;
    bestProject: { id: string; title: string; nickname: string; avgOverall: number } | null;
    topTechnologies: string[];
}

// Respuesta de GET /api/users/me
export interface MyAccount {
    id: string;
    fullName: string;
    username: string;
    email: string;
    bio: string | null;
    avatarPath: string | null;
    linkLinkedin: string | null;
    linkWebsite: string | null;
    linkGithub: string | null;
    linkGitlab: string | null;
    linkBitbucket: string | null;
    linkInstagram: string | null;
    linkYoutube: string | null;
    createdAt: string;
}

// Cuerpo de PUT /api/users/me
export interface ProfileData {
    fullName: string;
    username: string;
    bio: string;
    linkLinkedin: string;
    linkWebsite: string;
    linkGithub: string;
    linkGitlab: string;
    linkBitbucket: string;
    linkInstagram: string;
    linkYoutube: string;
}

// Cuerpo de PUT /api/auth/change-password
export interface PasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}