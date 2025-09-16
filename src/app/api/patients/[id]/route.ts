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

    // Determine if caller is admin by fetching doctor record
    let doctorRecord: any = null;
    try {
      doctorRecord = await prisma.doctor.findUnique({ where: { id: doctor.doctorId } });
    } catch (e) {
      console.error('Doctor lookup failed', e);
    }
    const isAdmin = doctorRecord && doctorRecord.role === 'ADMIN';

    // If admin: fetch patient by id only. If not: ensure ownership.
    const patient = await prisma.patient.findFirst({
      where: isAdmin
        ? { id: params.id }
        : { id: params.id, doctorId: doctor.doctorId },
      include: { caregiver: true, ...(isAdmin ? { doctor: true } : {}) }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Build where clause for results; admin sees all results tied to the patient regardless of doctor
    const resultWhere: any = {
      OR: [
        { patientId: params.id },
        { caregiver: { patients: { some: { id: params.id } } } }
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
      ...patient,
      ...(isAdmin
        ? { doctorName: (patient as any).doctor?.name || null, doctorEmail: (patient as any).doctor?.email || null }
        : {}),
      results
    });
  } catch (error) {
    console.error('Get patient detail error:', error);
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

    // Check if patient exists and belongs to the doctor
    const patient = await prisma.patient.findUnique({
      where: { 
        id: params.id,
        doctorId: doctor.doctorId
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Delete all screening results associated with this patient
    await prisma.screeningResult.deleteMany({
      where: { patientId: params.id }
    });

    // Delete the patient
    await prisma.patient.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
