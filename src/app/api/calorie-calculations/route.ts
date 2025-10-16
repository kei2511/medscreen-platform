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
      console.error('Unauthorized request to get calorie calculations');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Get calorie calculations for doctor:', doctor); // Debug log

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');

    // Determine if caller is admin doctor by fetching doctor record
    let doctorRecord: any = null;
    try {
      doctorRecord = await prisma.doctor.findUnique({ where: { id: doctor.doctorId } });
    } catch (e) {
      console.error('Doctor lookup failed', e);
    }

    const isAdmin = doctorRecord && doctorRecord.role === 'ADMIN';

    // Build query conditions
    const whereClause: any = isAdmin ? {} : { doctorId: doctor.doctorId };

    if (targetId && targetType) {
      whereClause[`${targetType}Id`] = targetId;
    }

    console.log('Querying calorie calculations with where clause:', whereClause); // Debug log

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
      console.error('Unauthorized request to save calorie calculation');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Saving calorie calculation for doctor:', doctor); // Debug log
    
    const body = await request.json();
    
    console.log('Received body for calorie calculation:', body); // Debug log
    
    // Validate required fields
    const { targetId, targetType, gender, heightCm, weightKg, age, activity, result } = body;
    
    if (!targetId || !targetType || !gender || !heightCm || !weightKg || !age || !activity || !result) {
      console.error('Missing required fields for calorie calculation', { targetId, targetType, gender, heightCm, weightKg, age, activity, result });
      return NextResponse.json(
        { error: 'Semua field wajib diisi' }, 
        { status: 400 }
      );
    }

    if (targetType !== 'patient' && targetType !== 'caregiver') {
      console.error('Invalid target type', targetType);
      return NextResponse.json(
        { error: 'Target type harus patient atau caregiver' }, 
        { status: 400 }
      );
    }

    // Determine if caller is admin doctor by fetching doctor record
    let doctorRecord: any = null;
    try {
      doctorRecord = await prisma.doctor.findUnique({ where: { id: doctor.doctorId } });
    } catch (e) {
      console.error('Doctor lookup failed', e);
    }

    const isAdmin = doctorRecord && doctorRecord.role === 'ADMIN';

    // Verify that the user has access to this patient or caregiver
    let exists = false;
    let targetName = '';
    const doctorId = isAdmin ? targetId  // For admin, they can access any target
      : doctor.doctorId;                // For non-admin, use their own doctorId

    console.log('Checking access - isAdmin:', isAdmin, 'doctorId:', doctorId, 'targetType:', targetType, 'targetId:', targetId); // Debug log

    if (targetType === 'patient') {
      const patient = await prisma.patient.findFirst({
        where: isAdmin ? { id: targetId } : { id: targetId, doctorId }
      });
      console.log('Patient lookup result:', patient ? 'Found' : 'Not found'); // Debug log
      exists = !!patient;
      targetName = patient?.name || 'Unknown Patient';
    } else if (targetType === 'caregiver') {
      const caregiver = await prisma.caregiver.findFirst({
        where: isAdmin ? { id: targetId } : { id: targetId, doctorId }
      });
      console.log('Caregiver lookup result:', caregiver ? 'Found' : 'Not found'); // Debug log
      exists = !!caregiver;
      targetName = caregiver?.nama_keluarga || 'Unknown Caregiver';
    }

    if (!exists) {
      console.error('User does not have access to this target', { targetId, targetType, doctorId, isAdmin });
      return NextResponse.json(
        { error: 'Akses ke target tidak ditemukan atau tidak diizinkan' }, 
        { status: 403 }
      );
    }

    console.log('Creating calorie calculation for:', targetName, 'Type:', targetType, 'Doctor ID:', doctorId); // Debug log

    // Create the calorie calculation record
    const calorieCalculation = await prisma.calorieCalculation.create({
      data: {
        [`${targetType}Id`]: targetId,  // Dynamically set either patientId or caregiverId
        doctorId: doctor.doctorId,  // Use the authenticated doctor's ID
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

    console.log('Successfully saved calorie calculation with ID:', calorieCalculation.id); // Debug log

    return NextResponse.json(calorieCalculation, { status: 201 });
  } catch (error) {
    console.error('Create calorie calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}