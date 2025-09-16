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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getTokenPayload(request);
    if (!payload?.doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    if (!doctor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((doctor as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only admin can edit questionnaires.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, jenis_kuesioner, questions, resultTiers, isPublic } = body;

    // Validate input
    if (!title || !Array.isArray(questions) || !Array.isArray(resultTiers) || !jenis_kuesioner) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Verify the questionnaire belongs to the doctor
    const existingQuestionnaire = await prisma.questionnaireTemplate.findFirst({
      where: {
        id: params.id,
        doctorId: payload.doctorId
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
        description,
        jenis_kuesioner,
        questions: questions as any,
        resultTiers: resultTiers as any,
        ...(typeof isPublic === 'boolean' ? { isPublic } : {})
      }
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
    const payload = await getTokenPayload(request);

    // Unauthenticated / respondent: only allow public questionnaire by id
    if (!payload || payload.role === 'RESPONDENT') {
      let q: any = null;
      try {
        q = await prisma.questionnaireTemplate.findUnique({ where: { id: params.id } });
      } catch (err) {
        console.error('GET questionnaire public lookup error:', err);
        return NextResponse.json({ error: 'Internal server error (QID1)' }, { status: 500 });
      }
      if (!q) return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 });
      // Only return if isPublic = true when property exists
      if (Object.prototype.hasOwnProperty.call(q, 'isPublic')) {
        if (!(q as any).isPublic) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        // If column not present (schema mismatch) we err on the side of denying access
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json(q);
    }

    // Doctor flow: require doctorId and ownership
    if (!payload.doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let questionnaire: any = null;
    try {
      questionnaire = await prisma.questionnaireTemplate.findUnique({
        where: {
          id: params.id,
          doctorId: payload.doctorId
        }
      });
    } catch (err) {
      console.error('GET questionnaire doctor lookup error:', err);
      return NextResponse.json({ error: 'Internal server error (QID2)' }, { status: 500 });
    }

    if (!questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 });
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
    const payload = await getTokenPayload(request);
    if (!payload?.doctorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const questionnaire = await prisma.questionnaireTemplate.findUnique({
      where: { 
        id: params.id,
        doctorId: payload.doctorId
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
