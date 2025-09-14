import { TokenPayload } from './auth';
import { NextResponse } from 'next/server';

export function requireRole(token: TokenPayload | null, requiredRole: 'ADMIN' | 'USER') {
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (requiredRole === 'ADMIN' && token.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export function isAdmin(token: TokenPayload | null): boolean {
  return token?.role === 'ADMIN';
}

export function filterDataByRole(token: TokenPayload | null, data: any[], doctorIdField = 'doctorId') {
  if (!token) return [];
  if (isAdmin(token)) return data;
  return data.filter(item => item[doctorIdField] === token.doctorId);
}