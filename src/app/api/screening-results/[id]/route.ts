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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine if caller is admin
    let doctorRecord: any = null;
    try {
      doctorRecord = await prisma.doctor.findUnique({ where: { id: doctor.doctorId } });
    } catch (e) {
      console.error('Doctor lookup failed', e);
    }
    const isAdmin = doctorRecord && doctorRecord.role === 'ADMIN';

    // If admin: search by id only; else enforce doctor ownership
    const result = await prisma.screeningResult.findFirst({
      where: isAdmin ? { id: params.id } : { id: params.id, doctorId: doctor.doctorId },
      include: {
        patient: true,
        caregiver: true,
        template: true,
        ...(isAdmin ? { doctor: true } : {})
      }
    });

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...result,
      ...(isAdmin ? { doctorName: (result as any).doctor?.name || null, doctorEmail: (result as any).doctor?.email || null } : {})
    });
  } catch (error) {
    console.error('Get screening result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
