import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Unified helper
async function getTokenPayload(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload(request);

    // If unauthenticated -> only return public questionnaires (no sensitive data)
    if (!payload) {
      const all = await prisma.questionnaireTemplate.findMany({ orderBy: { createdAt: 'desc' } });
      // Fallback filtering: some generated client might not yet have isPublic typed
      const publicQs = (all as any[]).filter(q => (q as any).isPublic);
      return NextResponse.json(publicQs);
    }

    // Respondent: boleh melihat hanya public questionnaires
    if (payload.role === 'RESPONDENT') {
      const all = await prisma.questionnaireTemplate.findMany({ orderBy: { createdAt: 'desc' } });
      const respondentQs = (all as any[]).filter(q => (q as any).isPublic);
      return NextResponse.json(respondentQs);
    }

    // Doctor path
    if (!payload.doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    if (!doctor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const whereClause = { doctorId: doctor.id } as const;

    const questionnaires = await prisma.questionnaireTemplate.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(questionnaires);
  } catch (error) {
    console.error('Get questionnaires error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload(request);
    if (!payload?.doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    if (!doctor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((doctor as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only admin can create questionnaires.' }, { status: 403 });
    }

    const { title, description, jenis_kuesioner, questions, resultTiers, isPublic } = await request.json();

    if (!title || !questions || !resultTiers || !jenis_kuesioner) {
      return NextResponse.json(
        { error: 'Title, questions, result tiers, and jenis kuesioner are required' },
        { status: 400 }
      );
    }

    const questionnaire = await prisma.questionnaireTemplate.create({
      data: {
        title,
        description,
        jenis_kuesioner,
        questions,
        resultTiers,
        // Cast isPublic only if field exists; if not present in generated client ignore via spread trick
        ...(typeof isPublic !== 'undefined' ? { isPublic: !!isPublic } : {}),
        doctorId: doctor.id
      }
    });

    return NextResponse.json(questionnaire);
  } catch (error) {
    console.error('Create questionnaire error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
