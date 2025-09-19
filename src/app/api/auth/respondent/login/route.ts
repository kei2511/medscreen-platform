import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib' }, { status: 400 });
    }

    const respondent = await prisma.respondent.findUnique({ where: { email } });
    if (!respondent || !verifyPassword(password, respondent.password)) {
      return NextResponse.json({ error: 'Kredensial salah' }, { status: 401 });
    }

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
    res.headers.set('Set-Cookie', `respondent_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);
    return res;
  } catch (e) {
    console.error('Respondent login error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
