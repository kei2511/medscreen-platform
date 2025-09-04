'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface Patient {
  id: string;
  name: string;
  age: number;
  jenis_kelamin: number;
  umur_pasien: number;
  lama_menderita_dm: number;
  penyakit_lain?: string;
  caregiver?: {
    id: string;
    nama_keluarga: string;
    jenis_kelamin: number;
    umur_keluarga: number;
    hubungan_dengan_pasien: string;
  };
  results: ScreeningResult[];
}

interface ScreeningResult {
  id: string;
  totalScore: number;
  resultLabel: string;
  date: string;
  patient?: {
    id: string;
    name: string;
  };
  caregiver?: {
    id: string;
    nama_keluarga: string;
    hubungan_dengan_pasien: string;
  };
  template: {
    title: string;
  };
}

export default function PatientDetail() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [filteredResults, setFilteredResults] = useState<ScreeningResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    fetchPatient();
  }, [router, patientId]);

  const fetchPatient = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatient(data);
        setFilteredResults(data.results || []);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.results) {
      let filtered = [...patient.results];

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(result => 
          result.template.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by risk level
      if (filterRisk !== 'all') {
        filtered = filtered.filter(result => result.resultLabel === filterRisk);
      }

      // Filter by date range
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        filtered = filtered.filter(result => {
          const resultDate = new Date(result.date);
          return resultDate >= startDate && resultDate <= endDate;
        });
      }

      // Sort results
      filtered.sort((a, b) => {
        if (sortBy === 'date') {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        } else {
          return sortOrder === 'asc' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
        }
      });

      setFilteredResults(filtered);
    }
  }, [patient, searchTerm, filterRisk, dateRange, sortBy, sortOrder]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleStartScreening = () => {
    router.push('/screening/new');
  };

  const handleViewResult = (resultId: string) => {
    router.push(`/screening/result/${resultId}`);
  };

  const getRiskColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'risiko rendah':
        return 'bg-green-100 text-green-800';
      case 'risiko sedang':
        return 'bg-yellow-100 text-yellow-800';
      case 'risiko tinggi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRisk('all');
    setDateRange({start: '', end: ''});
    setSortBy('date');
    setSortOrder('desc');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 sm:mt-4 text-black text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-black text-center">Pasien tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 py-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-black">Riwayat Skrining</h1>
              <p className="text-sm text-black">
                {patient.name} - {patient.age} tahun
                {patient.jenis_kelamin !== undefined && (
                  <span className="ml-2">
                    ({patient.jenis_kelamin === 1 ? 'Laki-laki' : 'Perempuan'})
                  </span>
                )}
              </p>
              {patient.caregiver && (
                <p className="text-xs text-gray-600">
                  Caregiver: {patient.caregiver.nama_keluarga} ({patient.caregiver.hubungan_dengan_pasien})
                </p>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleBack}
                className="flex-1 sm:flex-none px-3 py-2 text-sm text-black hover:text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleStartScreening}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Skrining Baru
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-black">Daftar Hasil Skrining</h2>
                <p className="text-xs sm:text-sm text-black">
                  Total: {filteredResults.length} dari {patient.results.length} skrining
                </p>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="p-3 sm:p-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-black mb-1">Cari</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama kuesioner..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Risk Filter */}
              <div>
                <label className="block text-xs font-medium text-black mb-1">Tingkat Risiko</label>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Semua</option>
                  <option value="Risiko Rendah">Risiko Rendah</option>
                  <option value="Risiko Sedang">Risiko Sedang</option>
                  <option value="Risiko Tinggi">Risiko Tinggi</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-medium text-black mb-1">Urutkan</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by as 'date' | 'score');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="date-desc">Tanggal Terbaru</option>
                  <option value="date-asc">Tanggal Terlama</option>
                  <option value="score-desc">Skor Tertinggi</option>
                  <option value="score-asc">Skor Terendah</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-black mb-1">Periode</label>
                <div className="flex gap-1">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y">
            {filteredResults.length === 0 ? (
              <div className="px-4 py-8 sm:px-6 sm:py-12 text-center">
                <p className="text-sm text-black">Tidak ada hasil skrining yang sesuai filter.</p>
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredResults.map((result) => (
                <div 
                  key={result.id} 
                  className="px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-50 cursor-pointer transition-colors" 
                  onClick={() => handleViewResult(result.id)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{result.template.title}</h3>
                      <p className="text-xs text-gray-500">
                        {result.caregiver 
                          ? `Oleh: ${result.caregiver.nama_keluarga} (${result.caregiver.hubungan_dengan_pasien})`
                          : 'Oleh: Pasien'
                        } • {new Date(result.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">{result.totalScore} poin</div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getRiskColor(result.resultLabel)}`}>
                        {result.resultLabel}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
