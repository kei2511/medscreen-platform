import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/caregivers - Mendapatkan semua caregiver untuk dokter yang login
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctorPayload = await verifyToken(token);
    if (!doctorPayload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let doctorRecord: any = null;
    try {
      doctorRecord = await prisma.doctor.findUnique({ where: { id: doctorPayload.doctorId } });
    } catch (e) {
      console.error('Doctor lookup failed', e);
    }
    const isAdmin = doctorRecord && doctorRecord.role === 'ADMIN';

    const whereClause: any = isAdmin ? {} : { doctorId: doctorPayload.doctorId };

    const caregivers = await prisma.caregiver.findMany({
      where: whereClause,
      include: {
        patients: {
          select: { id: true, name: true }
        },
        ...(isAdmin ? { doctor: true } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = isAdmin
      ? caregivers.map((c: any) => ({
          ...c,
          doctorName: c.doctor?.name || null,
          doctorEmail: c.doctor?.email || null
        }))
      : caregivers;

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/caregivers - Membuat caregiver baru
export async function POST(request: NextRequest) {
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

    const caregiver = await prisma.caregiver.create({
      data: {
        nama_keluarga,
        jenis_kelamin,
        umur_keluarga,
        hubungan_dengan_pasien,
        // doctorId is required (non-null); token payload for doctor must include doctorId
        doctorId: doctor.doctorId as string,
      },
    });

    return NextResponse.json(caregiver, { status: 201 });
  } catch (error) {
    console.error('Error creating caregiver:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 