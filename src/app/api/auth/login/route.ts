import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';

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
      email: doctor.email
    });

    return NextResponse.json({
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name
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
