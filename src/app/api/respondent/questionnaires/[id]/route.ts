import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.split(' ')[1];
  const cookieToken = req.cookies.get('respondent_token')?.value;
  return cookieToken || null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'RESPONDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.questionnaireTemplate.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, description: true, jenis_kuesioner: true, questions: true, resultTiers: true, createdAt: true }
    });

    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ template });
  } catch (e) {
    console.error('Detail questionnaire error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
