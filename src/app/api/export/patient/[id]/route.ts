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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const doctor = await getDoctorFromRequest(request);
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the patient belongs to the doctor
    const patient = await prisma.patient.findUnique({
      where: { id, doctorId: doctor.doctorId },
      include: {
        results: {
          include: {
            template: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (patient.results.length === 0) {
      return NextResponse.json(
        { error: 'No screening data available for this patient' },
        { status: 404 }
      );
    }

    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = [
      ['No', 'Tanggal', 'Kuesioner', 'Skor Total', 'Hasil', 'Umur Pasien']
    ];

    patient.results.forEach((result, index) => {
      excelData.push([
        (index + 1).toString(),
        new Date(result.date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        result.template.title,
        result.totalScore.toString(),
        result.resultLabel,
        patient.age.toString()
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Format date column
    const dateRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:F1');
    for (let R = dateRange.s.r + 1; R <= dateRange.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 1 }); // Column B (Tanggal)
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].z = 'dd/mm/yyyy';
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Skrining');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `riwayat-skrining-${patient.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Export patient error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
