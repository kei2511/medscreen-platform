import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
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

    const results = await prisma.screeningResult.findMany({
      where: { doctorId: doctor.doctorId },
      include: {
        patient: {
          include: {
            caregiver: true
          }
        },
        caregiver: true,
        template: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = [
      ['Responden', 'Umur', 'Jenis Kelamin', 'Umur Pasien (Detail)', 'Lama Menderita DM', 'Penyakit Lain', 'Caregiver', 'Hubungan Caregiver', 'Tanggal Skrining', 'Nama Kuesioner', 'Total Skor', 'Label Hasil']
    ];

    results.forEach(result => {
      const p = result.patient;
      const cg = result.caregiver;

      const respondenNama = p?.name || cg?.nama_keluarga || '-';
      const respondenUmur = p?.age ?? cg?.umur_keluarga ?? '-';
      const respondenJK = (p?.jenis_kelamin ?? cg?.jenis_kelamin) === 1 ? 'Laki-laki' : 'Perempuan';

      const umurDetail = p?.umur_pasien != null ? p.umur_pasien.toString() : '-';
      const lamaDM = p?.lama_menderita_dm != null ? p.lama_menderita_dm.toString() : '-';
      const penyakitLain = p?.penyakit_lain || '-';

      const caregiverNama = p?.caregiver?.nama_keluarga || cg?.nama_keluarga || '-';
      const caregiverHub = p?.caregiver?.hubungan_dengan_pasien || cg?.hubungan_dengan_pasien || '-';

      const tanggal = new Date(result.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      excelData.push([
        respondenNama,
        respondenUmur.toString(),
        respondenJK,
        umurDetail,
        lamaDM,
        penyakitLain,
        caregiverNama,
        caregiverHub,
        tanggal,
        result.template.title,
        result.totalScore.toString(),
        result.resultLabel
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Format date column (Tanggal Skrining is at index 8)
    const dateRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:L1');
    for (let R = dateRange.s.r + 1; R <= dateRange.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 8 });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].z = 'dd/mm/yyyy';
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Skrining');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `medscreen-results-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
