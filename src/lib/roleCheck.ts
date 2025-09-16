import { TokenPayload } from './auth';
import { NextResponse } from 'next/server';

function extractAppRole(token: TokenPayload | null): 'ADMIN' | 'USER' | undefined {
  if (!token) return undefined;
  // New structure: token.role = 'DOCTOR' | 'RESPONDENT'; appRole holds ADMIN/USER
  if (token.appRole === 'ADMIN' || token.appRole === 'USER') return token.appRole;
  // Legacy structure: token.role directly ADMIN/USER
  // Legacy scenario where token.role itself carried ADMIN/USER (before multi-principal change)
  if (typeof token.role === 'string' && ['ADMIN','USER'].includes(token.role as string)) {
    return token.role as 'ADMIN' | 'USER';
  }
  return undefined;
}

export function requireRole(token: TokenPayload | null, requiredRole: 'ADMIN' | 'USER') {
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const appRole = extractAppRole(token);
  if (requiredRole === 'ADMIN' && appRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export function isAdmin(token: TokenPayload | null): boolean {
  return extractAppRole(token) === 'ADMIN';
}

export function filterDataByRole(token: TokenPayload | null, data: any[], doctorIdField = 'doctorId') {
  if (!token) return [];
  if (isAdmin(token)) return data;
  return data.filter(item => item[doctorIdField] === token.doctorId);
}