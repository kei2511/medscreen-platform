import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './src/lib/auth';

// Protect respondent routes server-side (basic)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isRespondentApp = pathname.startsWith('/respondent');
  const isApiRespondent = pathname.startsWith('/api/respondent');

  if (isRespondentApp || isApiRespondent) {
    const token = req.cookies.get('respondent_token')?.value || extractBearer(req.headers.get('authorization'));
    if (!token) {
      if (isApiRespondent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const loginUrl = new URL('/respondent/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'RESPONDENT') {
      if (isApiRespondent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const loginUrl = new URL('/respondent/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

function extractBearer(auth: string | null): string | null {
  if (!auth) return null;
  if (auth.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
}

export const config = {
  matcher: [
    '/respondent/:path*',
    '/api/respondent/:path*'
  ]
};
