import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

/*
  Payload:
  {
    email, password, name?,
    patient: { name, age?, gender? },
    caregiver?: { name, relation? }
  }
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, patient, caregiver } = body || {};

    if (!email || !password || !patient?.name) {
      return NextResponse.json({ error: 'Email, password, dan nama pasien wajib' }, { status: 400 });
    }

    const existing = await prisma.respondent.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    const hashed = hashPassword(password);

    const respondent = await prisma.respondent.create({
      data: {
        email,
        password: hashed,
        name: name || null,
        patientName: patient.name,
        patientAge: patient.age ?? null,
        patientGender: patient.gender ?? null,
        caregiverName: caregiver?.name ?? null,
        caregiverRelation: caregiver?.relation ?? null
      }
    });

    const token = generateToken({
      email: respondent.email,
      role: 'RESPONDENT',
      respondentId: respondent.id
    });

    const res = NextResponse.json({
        token,
        respondent: {
          id: respondent.id,
          email: respondent.email,
          name: respondent.name,
          role: 'RESPONDENT',
          patientName: respondent.patientName,
          caregiverName: respondent.caregiverName
        }
      });
    // Set HttpOnly cookie via response header
    res.headers.set('Set-Cookie', `respondent_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);
    return res;
  } catch (e) {
    console.error('Respondent register error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
