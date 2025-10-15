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

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');

    // Build query conditions
    const whereClause: any = {
      doctorId: doctor.doctorId
    };

    if (targetId && targetType) {
      whereClause[`${targetType}Id`] = targetId;
    }

    const calorieCalculations = await prisma.calorieCalculation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        caregiver: true,
      }
    });

    return NextResponse.json(calorieCalculations);
  } catch (error) {
    console.error('Get calorie calculations error:', error);
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

    const body = await request.json();
    
    // Validate required fields
    const { targetId, targetType, gender, heightCm, weightKg, age, activity, result } = body;
    
    if (!targetId || !targetType || !gender || !heightCm || !weightKg || !age || !activity || !result) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' }, 
        { status: 400 }
      );
    }

    if (targetType !== 'patient' && targetType !== 'caregiver') {
      return NextResponse.json(
        { error: 'Target type harus patient atau caregiver' }, 
        { status: 400 }
      );
    }

    // Verify that the user has access to this patient or caregiver
    let exists = false;
    if (targetType === 'patient') {
      const patient = await prisma.patient.findFirst({
        where: {
          id: targetId,
          doctorId: doctor.doctorId
        }
      });
      exists = !!patient;
    } else if (targetType === 'caregiver') {
      const caregiver = await prisma.caregiver.findFirst({
        where: {
          id: targetId,
          doctorId: doctor.doctorId
        }
      });
      exists = !!caregiver;
    }

    if (!exists) {
      return NextResponse.json(
        { error: 'Akses ke target tidak ditemukan atau tidak diizinkan' }, 
        { status: 403 }
      );
    }

    // Create the calorie calculation record
    const calorieCalculation = await prisma.calorieCalculation.create({
      data: {
        [`${targetType}Id`]: targetId,  // Dynamically set either patientId or caregiverId
        doctorId: doctor.doctorId as string,
        gender,
        heightCm: parseFloat(heightCm),
        weightKg: parseFloat(weightKg),
        age: parseInt(age),
        activity,
        result: result,  // Store the entire result object as JSON
      },
      include: {
        patient: true,
        caregiver: true,
      }
    });

    return NextResponse.json(calorieCalculation, { status: 201 });
  } catch (error) {
    console.error('Create calorie calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}