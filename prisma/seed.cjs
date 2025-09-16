const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const questionnaireTemplates = [
  {
    title: 'Screening Distres Pasien (Contoh)',
    description: 'Template contoh untuk pasien',
    jenis_kuesioner: 'Pasien',
    questions: [
      {
        type: 'single',
        text: 'Seberapa sering Anda merasa lelah minggu ini?',
        options: [
          { label: 'Tidak Pernah', score: 0 },
          { label: 'Kadang-kadang', score: 1 },
          { label: 'Sering', score: 2 },
          { label: 'Sangat Sering', score: 3 }
        ]
      },
      {
        type: 'single',
        text: 'Apakah nafsu makan Anda menurun?',
        options: [
          { label: 'Tidak', score: 0 },
          { label: 'Ya sedikit', score: 1 },
          { label: 'Ya banyak', score: 2 }
        ]
      }
    ],
    resultTiers: [
      { min: 0, max: 2, label: 'Ringan', recommendation: 'Pertahankan pola hidup sehat.' },
      { min: 3, max: 4, label: 'Sedang', recommendation: 'Pertimbangkan konsultasi lanjut.' },
      { min: 5, max: 99, label: 'Berat', recommendation: 'Segera konsultasi tenaga medis.' }
    ]
  },
  {
    title: 'Beban Caregiver (Contoh)',
    description: 'Template contoh untuk keluarga/caregiver',
    jenis_kuesioner: 'Caregiver',
    questions: [
      {
        type: 'single',
        text: 'Apakah Anda merasa kewalahan merawat pasien?',
        options: [
          { label: 'Tidak Pernah', score: 0 },
          { label: 'Kadang-kadang', score: 1 },
          { label: 'Sering', score: 2 },
          { label: 'Hampir Selalu', score: 3 }
        ]
      }
    ],
    resultTiers: [
      { min: 0, max: 1, label: 'Normal', recommendation: 'Lanjutkan perawatan seperti biasa.' },
      { min: 2, max: 3, label: 'Perlu Perhatian', recommendation: 'Diskusikan strategi coping.' },
      { min: 4, max: 50, label: 'Butuh Dukungan', recommendation: 'Pertimbangkan bantuan profesional.' }
    ]
  }
];

async function seedTemplates(doctorId) {
  for (const tpl of questionnaireTemplates) {
    const created = await prisma.questionnaireTemplate.create({
      data: {
        title: tpl.title,
        description: tpl.description,
        jenis_kuesioner: tpl.jenis_kuesioner,
        doctorId,
        questions: tpl.questions,
        resultTiers: tpl.resultTiers
      }
    });
    console.log('Template created:', created.id, '-', created.title);
  }
}

async function main() {
  console.log('Seeding start...');
  const existingDoctor = await prisma.doctor.findFirst();
  if (existingDoctor) {
    // Promote first doctor to ADMIN if not already
    if (!existingDoctor.role || existingDoctor.role !== 'ADMIN') {
      await prisma.doctor.update({ where: { id: existingDoctor.id }, data: { role: 'ADMIN' } });
      console.log('Promoted existing first doctor to ADMIN');
    }
    console.log('Doctor already exists, using doctorId =', existingDoctor.id);
    await seedTemplates(existingDoctor.id);
    return;
  }
  const passwordHash = await bcrypt.hash('password123', 10);
  const doctor = await prisma.doctor.create({
    data: {
      email: 'system@local.test',
      password: passwordHash,
      name: 'System Doctor',
      role: 'ADMIN'
    }
  });
  console.log('Doctor created:', doctor.id);
  await seedTemplates(doctor.id);
}

main()
  .then(() => console.log('Seeding completed.'))
  .catch(e => { console.error('Seeding error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
