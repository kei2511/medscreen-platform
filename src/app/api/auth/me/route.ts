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

    const doctorData = await prisma.doctor.findUnique({
      where: { id: doctor.doctorId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    if (!doctorData) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json(doctorData);
  } catch (error) {
    console.error('Get doctor info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
