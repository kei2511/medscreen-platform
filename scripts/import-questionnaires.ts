import { PrismaClient, JenisKuesioner } from '@prisma/client';
import fs from 'fs';
import path from 'path';

/*
  Import Script: QuestionnaireTemplate
  Usage:
    1. Siapkan file data/questionnaires-import.json (copy dari .example) berisi { templates: [...] }
    2. Jalankan: npx ts-node --transpile-only scripts/import-questionnaires.ts --doctor <doctorEmail or doctorId> [--mode skip|upsert|force] [--dry-run]

  Mode:
    - skip (default): Lewati template jika sudah ada (cocokkan berdasarkan title + jenis_kuesioner)
    - upsert: Update description, questions, resultTiers, isPublic jika template sudah ada
    - force: Selalu buat template baru (bisa duplikat)

  Kriteria pencocokan existing: { title, jenis_kuesioner, doctorId yang dipilih }

  Catatan: Semua template akan di-import ke satu doctor (target) agar konsisten.
*/

interface ImportTemplateRaw {
  id?: string; // will be ignored
  title: string;
  description?: string | null;
  jenis_kuesioner: JenisKuesioner | string;
  isPublic?: boolean;
  questions: any;
  resultTiers: any;
  createdAt?: string;
  updatedAt?: string;
  doctorId?: string;
}

interface ImportFileShape {
  templates: ImportTemplateRaw[];
}

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  let doctorArg: string | undefined;
  let mode: 'skip' | 'upsert' | 'force' = 'skip';
  let dryRun = false;
  let customFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--doctor') {
      doctorArg = args[++i];
    } else if (a === '--mode') {
      const m = args[++i] as any;
      if (m === 'skip' || m === 'upsert' || m === 'force') mode = m; else throw new Error('Mode harus salah satu: skip|upsert|force');
    } else if (a === '--dry-run') {
      dryRun = true;
    } else if (a === '--file') {
      customFile = args[++i];
    }
  }

  if (!doctorArg) {
    throw new Error('Harus menyertakan --doctor <emailAtauIdDokter>');
  }

  // Cari doctor by email atau id
  const doctor = await prisma.doctor.findFirst({
    where: { OR: [{ id: doctorArg }, { email: doctorArg }] }
  });
  if (!doctor) throw new Error('Doctor tidak ditemukan untuk argumen: ' + doctorArg);

  // Determine file path precedence:
  // 1) --file path explicit
  // 2) data/questionnaires-import.json
  // 3) QuestionnaireTemplate.json di root (fallback)
  let chosenPath: string | null = null;
  if (customFile) {
    const abs = path.isAbsolute(customFile) ? customFile : path.join(process.cwd(), customFile);
    if (!fs.existsSync(abs)) throw new Error('File yang ditentukan di --file tidak ditemukan: ' + abs);
    chosenPath = abs;
  } else {
    const candidateData = path.join(process.cwd(), 'data', 'questionnaires-import.json');
    const candidateRoot = path.join(process.cwd(), 'QuestionnaireTemplate.json');
    if (fs.existsSync(candidateData)) {
      chosenPath = candidateData;
    } else if (fs.existsSync(candidateRoot)) {
      console.log('Peringatan: menggunakan fallback QuestionnaireTemplate.json di root. (Disarankan salin ke data/questionnaires-import.json)');
      chosenPath = candidateRoot;
    }
  }

  if (!chosenPath) {
    throw new Error('Tidak menemukan file import. Sediakan salah satu: --file <path> ATAU data/questionnaires-import.json ATAU QuestionnaireTemplate.json (root).');
  }

  console.log('Memuat file import:', chosenPath);
  const raw = fs.readFileSync(chosenPath, 'utf8');
  let parsedAny: any;
  try {
    parsedAny = JSON.parse(raw);
  } catch (e) {
    throw new Error('JSON tidak valid: ' + (e as Error).message);
  }

  // Mendukung format: { templates: [...] } ATAU langsung [...]
  let templates: ImportTemplateRaw[] = [];
  if (Array.isArray(parsedAny)) {
    templates = parsedAny as ImportTemplateRaw[];
  } else if (parsedAny && Array.isArray(parsedAny.templates)) {
    templates = parsedAny.templates as ImportTemplateRaw[];
  } else {
    throw new Error('Format file tidak dikenali. Gunakan array atau { "templates": [...] }');
  }

  if (templates.length === 0) {
    console.log('Tidak ada template untuk di-import.');
    return;
  }

  console.log('Import mulai...');
  console.log('Doctor target:', doctor.email, '(', doctor.id, ')');
  console.log('Mode:', mode, '| Dry-run:', dryRun);
  console.log('Jumlah templates input:', templates.length);
  if (templates.length === 1 && templates[0].title === 'Contoh Judul') {
    console.log('Peringatan: Sepertinya Anda masih memakai file contoh (example). Tidak akan di-import. Keluar.');
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const actions: string[] = [];

  for (const tRaw of templates) {
    // Clone untuk modifikasi
    const t: ImportTemplateRaw = { ...tRaw };

    // Normalisasi questions: option.text -> option.label bila front-end butuh label (kita simpan tetap text karena UI pakai text).
    // Hanya lakukan penyesuaian minimal: pastikan score angka.
    if (Array.isArray(t.questions)) {
      t.questions = t.questions.map((q: any) => {
        const qCopy: any = { ...q };
        if ((qCopy.type === 'multiple_choice' || qCopy.type === 'multiple_selection') && Array.isArray(qCopy.options)) {
          qCopy.options = qCopy.options.map((opt: any) => ({
            ...opt,
            score: Number(opt.score) || 0,
            type: opt.type || 'fixed'
          }));
        }
        return qCopy;
      });
    }

    // Normalisasi resultTiers: dukung minScore/maxScore atau min/max
    if (Array.isArray(t.resultTiers)) {
      t.resultTiers = t.resultTiers.map((tier: any) => {
        const { minScore, maxScore, min, max, label, recommendation } = tier;
        return {
          minScore: typeof minScore === 'number' ? minScore : (typeof min === 'number' ? min : 0),
            maxScore: typeof maxScore === 'number' ? maxScore : (typeof max === 'number' ? max : 0),
          label: label || '',
          recommendation: recommendation || ''
        };
      });
    }
    if (!t.title || !t.jenis_kuesioner || !t.questions || !t.resultTiers) {
      actions.push(`[SKIP FORMAT] Title / jenis_kuesioner / questions / resultTiers wajib ada => ${t.title}`);
      skipped++;
      continue;
    }
    const jenis = (t.jenis_kuesioner as string) as JenisKuesioner;

    const existing = await prisma.questionnaireTemplate.findFirst({
      where: { title: t.title, jenis_kuesioner: jenis, doctorId: doctor.id }
    });

    if (existing) {
      if (mode === 'skip') {
        skipped++;
        actions.push(`[SKIP ADA] ${t.title} (${jenis})`);
        continue;
      } else if (mode === 'upsert') {
        if (!dryRun) {
          await prisma.questionnaireTemplate.update({
            where: { id: existing.id },
            data: {
              description: t.description || null,
              questions: t.questions as any,
              resultTiers: t.resultTiers as any,
              isPublic: t.isPublic ?? existing.isPublic
            }
          });
        }
        updated++;
        actions.push(`[UPDATE] ${t.title} (${jenis})`);
        continue;
      } // force => create duplikat
    }

    if (!dryRun) {
      await prisma.questionnaireTemplate.create({
        data: {
          title: t.title,
          description: t.description || null,
          jenis_kuesioner: jenis,
          doctorId: doctor.id,
          questions: t.questions as any,
          resultTiers: t.resultTiers as any,
          isPublic: t.isPublic ?? false
        }
      });
    }
    created++;
    actions.push(`[CREATE] ${t.title} (${jenis})`);
  }

  console.log('--- Ringkasan Aksi ---');
  actions.forEach(a => console.log(a));
  console.log('----------------------');
  console.log('Hasil: created =', created, '| updated =', updated, '| skipped =', skipped);
  if (dryRun) console.log('Dry-run selesai: tidak ada perubahan ditulis ke DB.');
}

main()
  .catch(e => {
    console.error('Import error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
