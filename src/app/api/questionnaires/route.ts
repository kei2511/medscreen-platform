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
      let all: any[] = [];
      try {
        all = await prisma.questionnaireTemplate.findMany({ orderBy: { createdAt: 'desc' } });
      } catch (err) {
        console.error('GET questionnaires (anon) primary query error:', err);
        // Fallback minimal select to avoid potential column mismatch crashes
        try {
          all = await prisma.questionnaireTemplate.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, description: true, jenis_kuesioner: true, createdAt: true }
          }) as any[];
        } catch (err2) {
          console.error('GET questionnaires (anon) fallback query error:', err2);
          return NextResponse.json({ error: 'Internal server error (Q1)' }, { status: 500 });
        }
      }
      const publicQs = (all as any[]).filter(q => Object.prototype.hasOwnProperty.call(q, 'isPublic') ? (q as any).isPublic : false);
      return NextResponse.json(publicQs);
    }

    // Respondent: boleh melihat hanya public questionnaires
    if (payload.role === 'RESPONDENT') {
      let all: any[] = [];
      try {
        all = await prisma.questionnaireTemplate.findMany({ orderBy: { createdAt: 'desc' } });
      } catch (err) {
        console.error('GET questionnaires (respondent) primary query error:', err);
        try {
          all = await prisma.questionnaireTemplate.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, description: true, jenis_kuesioner: true, createdAt: true }
          }) as any[];
        } catch (err2) {
          console.error('GET questionnaires (respondent) fallback query error:', err2);
          return NextResponse.json({ error: 'Internal server error (Q2)' }, { status: 500 });
        }
      }
      const respondentQs = (all as any[]).filter(q => Object.prototype.hasOwnProperty.call(q, 'isPublic') ? (q as any).isPublic : false);
      return NextResponse.json(respondentQs);
    }

    // Doctor path
    if (!payload.doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let doctor: any = null;
    try {
      doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    } catch (err) {
      console.error('GET questionnaires doctor lookup error:', err);
      return NextResponse.json({ error: 'Internal server error (D1)' }, { status: 500 });
    }
    if (!doctor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const whereClause = { doctorId: doctor.id } as const;

    let questionnaires: any[] = [];
    try {
      questionnaires = await prisma.questionnaireTemplate.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    } catch (err) {
      console.error('GET questionnaires doctor primary query error:', err);
      try {
        questionnaires = await prisma.questionnaireTemplate.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, description: true, jenis_kuesioner: true, createdAt: true }
        }) as any[];
      } catch (err2) {
        console.error('GET questionnaires doctor fallback query error:', err2);
        return NextResponse.json({ error: 'Internal server error (Q3)' }, { status: 500 });
      }
    }

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

    let doctor: any = null;
    try {
      doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    } catch (err) {
      console.error('POST questionnaire doctor lookup error:', err);
      return NextResponse.json({ error: 'Internal server error (D2)' }, { status: 500 });
    }
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

    let questionnaire: any = null;
    try {
      questionnaire = await prisma.questionnaireTemplate.create({
        data: {
          title,
          description,
          jenis_kuesioner,
          questions,
          resultTiers,
          ...(typeof isPublic !== 'undefined' ? { isPublic: !!isPublic } : {}),
          doctorId: doctor.id
        }
      });
    } catch (err) {
      console.error('Create questionnaire primary error:', err);
      // Retry without isPublic field if that's the cause
      if (typeof isPublic !== 'undefined') {
        try {
          questionnaire = await prisma.questionnaireTemplate.create({
            data: {
              title,
              description,
              jenis_kuesioner,
              questions,
              resultTiers,
              doctorId: doctor.id
            }
          });
        } catch (err2) {
          console.error('Create questionnaire fallback error:', err2);
          return NextResponse.json({ error: 'Internal server error (Q4)' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Internal server error (Q5)' }, { status: 500 });
      }
    }

    return NextResponse.json(questionnaire);
  } catch (error) {
    console.error('Create questionnaire error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
