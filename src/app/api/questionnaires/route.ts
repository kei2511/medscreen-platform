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
      try {
        const publicQs = await prisma.questionnaireTemplate.findMany({
          where: ({ isPublic: true } as any),
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(publicQs);
      } catch (err) {
        console.error('GET questionnaires (anon) error:', err);
        return NextResponse.json({ error: 'Internal server error (Q1)' }, { status: 500 });
      }
    }

    // Respondent: boleh melihat hanya public questionnaires
    if (payload.role === 'RESPONDENT') {
      try {
        const publicQs = await prisma.questionnaireTemplate.findMany({
          where: ({ isPublic: true } as any),
          orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(publicQs);
      } catch (err) {
        console.error('GET questionnaires (respondent) error:', err);
        return NextResponse.json({ error: 'Internal server error (Q2)' }, { status: 500 });
      }
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

    // Doctor can see own questionnaires + public from other doctors
    try {
      const questionnaires = await prisma.questionnaireTemplate.findMany({
        where: ({
          OR: [
            { doctorId: doctor.id },
            { isPublic: true } as any
          ]
        } as any),
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(questionnaires);
    } catch (err) {
      console.error('GET questionnaires doctor error:', err);
      return NextResponse.json({ error: 'Internal server error (Q3)' }, { status: 500 });
    }
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

    const { title, description, youtubeUrl, youtubeUrls, jenis_kuesioner, questions, resultTiers, isPublic } = await request.json();

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
          youtubeUrl: youtubeUrl || null,
          youtubeUrls: youtubeUrls || [], // Include the array of additional video URLs
          jenis_kuesioner,
          questions,
          resultTiers,
          ...(typeof isPublic !== 'undefined' ? { isPublic: !!isPublic } : {}),
          doctorId: doctor.id
        } as any
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
              youtubeUrl: youtubeUrl || null,
              youtubeUrls: youtubeUrls || [], // Include the array of additional video URLs
              jenis_kuesioner,
              questions,
              resultTiers,
              doctorId: doctor.id
            } as any
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
