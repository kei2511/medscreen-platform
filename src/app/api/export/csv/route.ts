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
        patient: true,
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
      ['Nama Pasien', 'Umur Pasien', 'Tanggal Skrining', 'Nama Kuesioner', 'Total Skor', 'Label Hasil']
    ];

    results.forEach(result => {
      excelData.push([
        result.patient.name,
        result.patient.age.toString(),
        new Date(result.date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        result.template.title,
        result.totalScore.toString(),
        result.resultLabel
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Format date column
    const dateRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:F1');
    for (let R = dateRange.s.r + 1; R <= dateRange.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 2 }); // Column C (Tanggal)
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
