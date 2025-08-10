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

    const { name, age } = await request.json();

    if (!name || !age) {
      return NextResponse.json(
        { error: 'Name and age are required' },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        age: parseInt(age),
        doctorId: doctor.doctorId
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
