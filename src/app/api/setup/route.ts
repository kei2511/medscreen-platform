import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Check if database is accessible
    const doctorCount = await prisma.doctor.count();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      doctorCount,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Try to create a test doctor
    const testDoctor = await prisma.doctor.create({
      data: {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'Test Doctor'
      }
    });
    
    // Delete the test doctor
    await prisma.doctor.delete({
      where: { id: testDoctor.id }
    });
    
    return NextResponse.json({
      status: 'success',
      message: 'Database is working correctly',
      test: 'Create and delete operations successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 