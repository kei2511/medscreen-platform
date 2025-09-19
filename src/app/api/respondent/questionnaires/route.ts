import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.split(' ')[1];
  const cookieToken = req.cookies.get('respondent_token')?.value;
  return cookieToken || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'RESPONDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const include = searchParams.get('include'); // 'questions' | 'full'
    const selectBase: any = { id: true, title: true, description: true, jenis_kuesioner: true, createdAt: true };
    if (include === 'questions' || include === 'full') {
      selectBase.questions = true;
      selectBase.resultTiers = true;
    }

    const templates = await prisma.questionnaireTemplate.findMany({
      select: selectBase,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (e) {
    console.error('List questionnaires error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
