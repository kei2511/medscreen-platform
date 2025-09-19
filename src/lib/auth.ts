import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export interface TokenPayload {
  email: string;
  role: 'DOCTOR' | 'RESPONDENT'; // principal type
  doctorId?: string;
  respondentId?: string;
  appRole?: 'USER' | 'ADMIN'; // application-level role for doctor accounts
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    return {
      email: decoded.email as string,
      role: decoded.role as 'DOCTOR' | 'RESPONDENT',
      doctorId: decoded.doctorId as string | undefined,
      respondentId: decoded.respondentId as string | undefined,
      appRole: decoded.appRole as 'USER' | 'ADMIN' | undefined
    };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}
