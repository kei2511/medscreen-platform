import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/caregivers/[id] - Mendapatkan detail caregiver
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await verifyToken(token);
    if (!doctor) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const caregiver = await prisma.caregiver.findFirst({
      where: {
        id: params.id,
        doctorId: doctor.doctorId
      },
      include: {
        patients: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!caregiver) {
      return NextResponse.json(
        { error: 'Caregiver tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(caregiver);
  } catch (error) {
    console.error('Error fetching caregiver:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/caregivers/[id] - Update caregiver
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await verifyToken(token);
    if (!doctor) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { nama_keluarga, jenis_kelamin, umur_keluarga, hubungan_dengan_pasien } = body;

    // Validasi input
    if (!nama_keluarga || jenis_kelamin === undefined || !umur_keluarga || !hubungan_dengan_pasien) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (jenis_kelamin !== 0 && jenis_kelamin !== 1) {
      return NextResponse.json(
        { error: 'Jenis kelamin harus 0 (Perempuan) atau 1 (Laki-laki)' },
        { status: 400 }
      );
    }

    if (umur_keluarga < 0 || umur_keluarga > 150) {
      return NextResponse.json(
        { error: 'Umur harus antara 0-150 tahun' },
        { status: 400 }
      );
    }

    // Check if caregiver exists and belongs to doctor
    const existingCaregiver = await prisma.caregiver.findFirst({
      where: {
        id: params.id,
        doctorId: doctor.doctorId
      }
    });

    if (!existingCaregiver) {
      return NextResponse.json(
        { error: 'Caregiver tidak ditemukan' },
        { status: 404 }
      );
    }

    const caregiver = await prisma.caregiver.update({
      where: { id: params.id },
      data: {
        nama_keluarga,
        jenis_kelamin,
        umur_keluarga,
        hubungan_dengan_pasien,
      },
      include: {
        patients: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(caregiver);
  } catch (error) {
    console.error('Error updating caregiver:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/caregivers/[id] - Delete caregiver
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctor = await verifyToken(token);
    if (!doctor) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if caregiver exists and belongs to doctor
    const existingCaregiver = await prisma.caregiver.findFirst({
      where: {
        id: params.id,
        doctorId: doctor.doctorId
      },
      include: {
        patients: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existingCaregiver) {
      return NextResponse.json(
        { error: 'Caregiver tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if caregiver has associated patients
    if (existingCaregiver.patients.length > 0) {
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus caregiver yang masih memiliki pasien terkait',
          patients: existingCaregiver.patients
        },
        { status: 400 }
      );
    }

    // Delete caregiver
    await prisma.caregiver.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      message: 'Caregiver berhasil dihapus',
      deletedCaregiver: existingCaregiver
    });
  } catch (error) {
    console.error('Error deleting caregiver:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 