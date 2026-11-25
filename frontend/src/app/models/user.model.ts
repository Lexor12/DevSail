
//Datos del usuario que tiene la sesión activa
export interface User {
    id: string;
    fullName: string;
    username: string;
    email?: string;
    role: 'developer' | 'admin';
    avatarUrl?: string | null;
}

// Respuesta al iniciar sesión o verificar el correo
export interface SessionResponse {
    message: string;
    user: User;
}

// Datos que se mandan al registrarse
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
    avatarUrl: string | null;
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

// Respuesta con los datos de mi cuenta
export interface MyAccount {
    id: string;
    fullName: string;
    username: string;
    email: string;
    bio: string | null;
    avatarUrl: string | null;
    linkLinkedin: string | null;
    linkWebsite: string | null;
    linkGithub: string | null;
    linkGitlab: string | null;
    linkBitbucket: string | null;
    linkInstagram: string | null;
    linkYoutube: string | null;
    createdAt: string;
}

// Datos que se mandan al actualizar el perfil
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

// Datos que se mandan al cambiar la contraseña
export interface PasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}