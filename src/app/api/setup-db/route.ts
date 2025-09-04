import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database setup...');
    
    // Test connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Push schema to database
    const { execSync } = require('child_process');
    
    try {
      console.log('Pushing schema to database...');
      execSync('npx prisma db push --force-reset', { 
        stdio: 'inherit',
        env: process.env 
      });
      console.log('Schema pushed successfully');
    } catch (pushError) {
      console.error('Schema push failed:', pushError);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to push schema',
        error: pushError instanceof Error ? pushError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Test if tables exist
    const doctorCount = await prisma.doctor.count();
    const patientCount = await prisma.patient.count();
    const caregiverCount = await prisma.caregiver.count();
    
    console.log('Database setup completed successfully');
    
    return NextResponse.json({
      status: 'success',
      message: 'Database setup completed',
      tables: {
        doctors: doctorCount,
        patients: patientCount,
        caregivers: caregiverCount
      },
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
    
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database setup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    await prisma.$connect();
    
    // Check if tables exist by trying to query them
    const tables = {
      doctors: await prisma.doctor.count(),
      patients: await prisma.patient.count(),
      caregivers: await prisma.caregiver.count(),
      questionnaires: await prisma.questionnaireTemplate.count(),
      results: await prisma.screeningResult.count()
    };
    
    return NextResponse.json({
      status: 'success',
      message: 'Database is accessible',
      tables,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 