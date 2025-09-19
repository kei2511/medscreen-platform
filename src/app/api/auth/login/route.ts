import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { email }
    });

    if (!doctor || !verifyPassword(password, doctor.password)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken({
      doctorId: doctor.id,
      email: doctor.email,
      role: 'DOCTOR', // high-level principal type
      // embed application-level role (ADMIN/USER) for convenience
      appRole: (doctor as any).role || 'USER'
    } as any);

    return NextResponse.json({
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: (doctor as any).role || 'USER'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
