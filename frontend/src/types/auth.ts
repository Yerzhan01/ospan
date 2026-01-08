export type UserRole = 'ADMIN' | 'TRACKER' | 'DOCTOR' | 'OPERATOR';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    phone: string | null;
    clinicId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface AuthResponse {
    user: User;
    tokens: TokenPair;
}

export interface LoginResponse {
    success: boolean;
    data: AuthResponse;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}
