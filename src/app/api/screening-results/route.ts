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

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const whereClause = patientId 
      ? { doctorId: doctor.doctorId, patientId }
      : { doctorId: doctor.doctorId };

    const results = await prisma.screeningResult.findMany({
      where: whereClause,
      include: {
        patient: true,
        template: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Get screening results error:', error);
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

    const { patientId, templateId, answers, totalScore, resultLabel, recommendation } = await request.json();

    if (!patientId || !templateId || !answers || totalScore === undefined || !resultLabel) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const screeningResult = await prisma.screeningResult.create({
      data: {
        patientId,
        templateId,
        doctorId: doctor.doctorId,
        answers,
        totalScore,
        resultLabel,
        recommendation
      },
      include: {
        patient: true,
        template: true
      }
    });

    return NextResponse.json(screeningResult);
  } catch (error) {
    console.error('Create screening result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
