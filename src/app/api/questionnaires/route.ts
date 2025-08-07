import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getDoctorFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionnaires = await prisma.questionnaireTemplate.findMany({
      where: { doctorId: doctor.doctorId },
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
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, questions, resultTiers } = await request.json();

    if (!title || !questions || !resultTiers) {
      return NextResponse.json(
        { error: 'Title, questions, and result tiers are required' },
        { status: 400 }
      );
    }

    const questionnaire = await prisma.questionnaireTemplate.create({
      data: {
        title,
        description,
        questions,
        resultTiers,
        doctorId: doctor.doctorId
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
