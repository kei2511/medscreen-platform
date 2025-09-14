import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if doctor already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email }
    });

    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Doctor with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = hashPassword(password);

    // Check if this is the first user
    const userCount = await prisma.doctor.count();
    const isFirstUser = userCount === 0;

    const doctor = await prisma.doctor.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: isFirstUser ? 'ADMIN' : 'USER'
      }
    });

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        role: doctor.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
