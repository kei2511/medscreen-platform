import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getTokenPayload(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getTokenPayload(request);
    if (!payload?.doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    if (!doctor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Dapatkan kuesioner berdasarkan role
    const questionnaires = await prisma.questionnaireTemplate.findMany({
      where: {
        doctorId: doctor.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(questionnaires);
  } catch (error) {
    console.error('Get questionnaires error:', error);
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
        doctorId: doctor.id
      }
    });

    return NextResponse.json(questionnaire);
  } catch (error) {
    console.error('Create questionnaire error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
