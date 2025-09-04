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

    const patients = await prisma.patient.findMany({
      where: { doctorId: doctor.doctorId },
      include: {
        caregiver: true,
        results: {
          include: {
            template: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
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

    const { 
      name, 
      age, 
      jenis_kelamin, 
      umur_pasien, 
      lama_menderita_dm, 
      penyakit_lain, 
      caregiverId 
    } = await request.json();

    // Validasi field wajib
    if (!name || !age) {
      return NextResponse.json(
        { error: 'Nama dan umur wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi jenis kelamin
    if (jenis_kelamin !== 0 && jenis_kelamin !== 1) {
      return NextResponse.json(
        { error: 'Jenis kelamin harus 0 (Perempuan) atau 1 (Laki-laki)' },
        { status: 400 }
      );
    }

    // Validasi umur
    if (umur_pasien < 0 || umur_pasien > 150) {
      return NextResponse.json(
        { error: 'Umur pasien harus antara 0-150 tahun' },
        { status: 400 }
      );
    }

    // Validasi lama menderita DM
    if (lama_menderita_dm < 0) {
      return NextResponse.json(
        { error: 'Lama menderita DM tidak boleh negatif' },
        { status: 400 }
      );
    }

    // Jika caregiverId diberikan, validasi bahwa caregiver milik dokter yang sama
    if (caregiverId) {
      const caregiver = await prisma.caregiver.findFirst({
        where: {
          id: caregiverId,
          doctorId: doctor.doctorId
        }
      });

      if (!caregiver) {
        return NextResponse.json(
          { error: 'Caregiver tidak ditemukan atau tidak memiliki akses' },
          { status: 400 }
        );
      }
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        age: parseInt(age),
        jenis_kelamin: jenis_kelamin ? parseInt(jenis_kelamin) : null,
        umur_pasien: parseInt(age), // Gunakan age sebagai umur_pasien
        lama_menderita_dm: lama_menderita_dm ? parseFloat(lama_menderita_dm) : null,
        penyakit_lain: penyakit_lain || null,
        caregiverId: caregiverId || null,
        doctorId: doctor.doctorId
      },
      include: {
        caregiver: true
      }
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
