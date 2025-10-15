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

    // Determine if caller is admin doctor by fetching doctor record
    let doctorRecord: any = null;
    try {
      doctorRecord = await prisma.doctor.findUnique({ where: { id: doctor.doctorId } });
    } catch (e) {
      console.error('Doctor lookup failed', e);
    }

    const isAdmin = doctorRecord && doctorRecord.role === 'ADMIN';

    const whereClause: any = isAdmin ? {} : { doctorId: doctor.doctorId };

    // Get patients
    const patients = await prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        age: true,
        jenis_kelamin: true,
      },
      orderBy: { name: 'asc' }
    });

    // Get caregivers
    const caregivers = await prisma.caregiver.findMany({
      where: whereClause,
      select: {
        id: true,
        nama_keluarga: true,
        umur_keluarga: true,
        jenis_kelamin: true,
      },
      orderBy: { nama_keluarga: 'asc' }
    });

    // Format the data with type indicators
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      type: 'patient' as const,
      jenis_kelamin: patient.jenis_kelamin
    }));

    const formattedCaregivers = caregivers.map(caregiver => ({
      id: caregiver.id,
      name: caregiver.nama_keluarga,
      age: caregiver.umur_keluarga,
      type: 'caregiver' as const,
      jenis_kelamin: caregiver.jenis_kelamin
    }));

    // Combine and sort by name
    const allPeople = [...formattedPatients, ...formattedCaregivers].sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({
      patients: formattedPatients,
      caregivers: formattedCaregivers,
      allPeople
    });
  } catch (error) {
    console.error('Get patients and caregivers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}