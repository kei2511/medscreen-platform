import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = auth.split(' ')[1];
    const payload = verifyToken(token || '');
    if (!payload || payload.role !== 'RESPONDENT' || !payload.respondentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissions = await prisma.respondentSubmission.findMany({
      where: { respondentId: payload.respondentId },
      orderBy: { createdAt: 'desc' },
      include: { template: { select: { title: true, jenis_kuesioner: true } } }
    });

    return NextResponse.json({ submissions });
  } catch (e) {
    console.error('Get submissions error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = auth.split(' ')[1];
    const payload = verifyToken(token || '');
    if (!payload || payload.role !== 'RESPONDENT' || !payload.respondentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { templateId, fillAs, answers } = body || {};
    if (!templateId || !fillAs || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

  const template = await prisma.questionnaireTemplate.findUnique({ where: { id: templateId } });
    if (!template) return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });

    // Validasi fillAs vs template.jenis_kuesioner
    if (template.jenis_kuesioner === 'Pasien' && fillAs !== 'Pasien') {
      return NextResponse.json({ error: 'Template khusus Pasien' }, { status: 400 });
    }
    if (template.jenis_kuesioner === 'Caregiver' && fillAs !== 'Caregiver') {
      return NextResponse.json({ error: 'Template khusus Caregiver' }, { status: 400 });
    }
    if (template.jenis_kuesioner === 'Keduanya' && !['Pasien','Caregiver'].includes(fillAs)) {
      return NextResponse.json({ error: 'Pilihan peran tidak valid' }, { status: 400 });
    }

    // Parse questions & tiers JSON
    let questions: any[] = [];
    try { questions = Array.isArray(template?.questions) ? (template as any).questions : JSON.parse(String(template?.questions || '[]')); } catch {}

    // Validasi & Hitung skor total
    let totalScore = 0;
    for (const ans of answers) {
      if (typeof ans.questionIndex !== 'number' || ans.questionIndex < 0 || ans.questionIndex >= questions.length) {
        return NextResponse.json({ error: 'Index pertanyaan tidak valid' }, { status: 400 });
      }
      const q = questions[ans.questionIndex];
      if (!q || typeof q.type !== 'string') {
        return NextResponse.json({ error: 'Struktur pertanyaan tidak valid' }, { status: 400 });
      }
      if (q.type === 'multiple_choice' || q.type === 'multiple_selection') {
        const opts: any[] = Array.isArray(q.options) ? q.options : [];
        if (q.type === 'multiple_choice') {
          if (!ans.selected) continue;
          const found = opts.find(o => o.text === ans.selected.text);
            if (!found) return NextResponse.json({ error: 'Opsi tidak valid' }, { status: 400 });
          totalScore += Number(found.score) || 0;
        } else { // multiple_selection
          const selectedOpts = Array.isArray(ans.selectedOptions) ? ans.selectedOptions : [];
          for (const so of selectedOpts) {
            const found = opts.find(o => o.text === so.text);
            if (!found) return NextResponse.json({ error: 'Opsi tidak valid' }, { status: 400 });
            totalScore += Number(found.score) || 0;
          }
        }
      } else if (q.type === 'text_input') {
        // Optional: bisa validasi panjang / emptiness
        continue;
      }
    }

    // Determine resultLabel & recommendation from resultTiers JSON
    let resultLabel: string | undefined = undefined;
    let recommendation: string | undefined = undefined;
    try {
      const tiers: any[] = Array.isArray(template?.resultTiers) ? (template as any).resultTiers : JSON.parse(String(template?.resultTiers || '[]'));
      for (const t of tiers) {
        if (typeof t.minScore === 'number' && typeof t.maxScore === 'number') {
          if (totalScore >= t.minScore && totalScore <= t.maxScore) {
            resultLabel = t.label;
            recommendation = t.recommendation;
            break;
          }
        }
      }
    } catch {}

    const created = await prisma.respondentSubmission.create({
      data: {
        respondentId: payload.respondentId,
        templateId,
        fillAs,
        totalScore,
        resultLabel: resultLabel || null,
        recommendation: recommendation || null,
        answers
      }
    });

    return NextResponse.json({
      id: created.id,
      totalScore,
      resultLabel: created.resultLabel,
      recommendation: created.recommendation
    });
  } catch (e) {
    console.error('Create submission error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
