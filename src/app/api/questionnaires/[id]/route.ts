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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, questions, resultTiers } = body;

    // Validate input
    if (!title || !Array.isArray(questions) || !Array.isArray(resultTiers)) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Verify the questionnaire belongs to the doctor
    const existingQuestionnaire = await prisma.questionnaireTemplate.findUnique({
      where: { 
        id: params.id,
        doctorId: doctor.doctorId
      }
    });

    if (!existingQuestionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Update the questionnaire
    const updatedQuestionnaire = await prisma.questionnaireTemplate.update({
      where: { id: params.id },
      data: {
        title,
        questions: questions as any,
        resultTiers: resultTiers as any,
      },
    });

    return NextResponse.json(updatedQuestionnaire);
  } catch (error) {
    console.error('Update questionnaire error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questionnaire = await prisma.questionnaireTemplate.findUnique({
      where: { 
        id: params.id,
        doctorId: doctor.doctorId
      }
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(questionnaire);
  } catch (error) {
    console.error('Get questionnaire error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if questionnaire exists and belongs to the doctor
    const questionnaire = await prisma.questionnaireTemplate.findUnique({
      where: { 
        id: params.id,
        doctorId: doctor.doctorId
      }
    });

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Delete all screening results associated with this questionnaire
    await prisma.screeningResult.deleteMany({
      where: { templateId: params.id }
    });

    // Delete the questionnaire
    await prisma.questionnaireTemplate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Questionnaire deleted successfully' });
  } catch (error) {
    console.error('Delete questionnaire error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
