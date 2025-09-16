import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function getDoctorFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
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

    // Determine admin
    let doctorRecord: any = null;
    try {
      doctorRecord = await prisma.doctor.findUnique({ where: { id: doctor.doctorId } });
    } catch (e) {
      console.error('Doctor lookup failed', e);
    }
    const isAdmin = doctorRecord && doctorRecord.role === 'ADMIN';

    // Fetch caregiver (admin: any doctor; non-admin: ownership)
    const caregiver = await prisma.caregiver.findFirst({
      where: isAdmin ? { id: params.id } : { id: params.id, doctorId: doctor.doctorId },
      include: {
        patients: { select: { id: true, name: true } },
        ...(isAdmin ? { doctor: true } : {})
      }
    });

    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    // Related screening results: those whose caregiverId matches OR patient belongs to this caregiver
    const resultWhere: any = {
      OR: [
        { caregiverId: caregiver.id },
        { patient: { caregiverId: caregiver.id } }
      ]
    };
    if (!isAdmin) {
      resultWhere.doctorId = doctor.doctorId;
    }

    const results = await prisma.screeningResult.findMany({
      where: resultWhere,
      include: {
        patient: { select: { id: true, name: true } },
        caregiver: { select: { id: true, nama_keluarga: true, hubungan_dengan_pasien: true } },
        template: { select: { title: true } }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({
      ...caregiver,
      ...(isAdmin ? { doctorName: (caregiver as any).doctor?.name || null, doctorEmail: (caregiver as any).doctor?.email || null } : {}),
      results
    });
  } catch (error) {
    console.error('Get caregiver history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
