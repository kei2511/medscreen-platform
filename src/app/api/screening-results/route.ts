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
    const caregiverId = searchParams.get('caregiverId');

    let whereClause: any = { doctorId: doctor.doctorId };
    if (patientId) {
      whereClause.patientId = patientId;
    }
    if (caregiverId) {
      whereClause.caregiverId = caregiverId;
    }

    const results = await prisma.screeningResult.findMany({
      where: whereClause,
      include: {
        patient: true,
        caregiver: true,
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

    const { patientId, caregiverId, templateId, answers, totalScore, resultLabel, recommendation } = await request.json();

    if ((!patientId && !caregiverId) || !templateId || !answers || totalScore === undefined || !resultLabel) {
      return NextResponse.json(
        { error: 'Patient or caregiver ID, template ID, answers, total score, and result label are required' },
        { status: 400 }
      );
    }

    const screeningResult = await prisma.screeningResult.create({
      data: {
        patientId: patientId || null,
        caregiverId: caregiverId || null,
        templateId,
        doctorId: doctor.doctorId,
        answers,
        totalScore,
        resultLabel,
        recommendation
      },
      include: {
        patient: true,
        caregiver: true,
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
