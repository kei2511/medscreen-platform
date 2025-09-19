'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface ScreeningResult {
  id: string;
  totalScore: number;
  resultLabel: string;
  date: string;
  patient?: { id: string; name: string } | null;
  caregiver?: { id: string; nama_keluarga: string; hubungan_dengan_pasien: string } | null;
  template: { title: string };
}

interface CaregiverHistoryResponse {
  id: string;
  nama_keluarga: string;
  jenis_kelamin: number;
  umur_keluarga: number;
  hubungan_dengan_pasien: string;
  patients: { id: string; name: string }[];
  doctorName?: string | null;
  doctorEmail?: string | null;
  results: ScreeningResult[];
}

export default function CaregiverHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const caregiverId = params.id as string;

  const [data, setData] = useState<CaregiverHistoryResponse | null>(null);
  const [filteredResults, setFilteredResults] = useState<ScreeningResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [riskFilter, setRiskFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  useEffect(() => {
    fetchHistory();
  }, [caregiverId]);

  const fetchHistory = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/');
        return;
      }
      const res = await fetch(`/api/caregivers/${caregiverId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        router.push('/caregivers');
        return;
      }
      const json = await res.json();
      setData(json);
      setFilteredResults(json.results || []);
    } catch (e) {
      console.error('Fetch caregiver history error', e);
      router.push('/caregivers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!data) return;
    let results = [...(data.results || [])];
    if (search) {
      results = results.filter(r => r.template.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (riskFilter !== 'all') {
      results = results.filter(r => r.resultLabel === riskFilter);
    }
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      results = results.filter(r => {
        const d = new Date(r.date);
        return d >= start && d <= end;
      });
    }
    results.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortOrder === 'asc' ? a.totalScore - b.totalScore : b.totalScore - a.totalScore;
      }
    });
    setFilteredResults(results);
  }, [data, search, riskFilter, dateRange, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearch('');
    setRiskFilter('all');
    setDateRange({ start: '', end: '' });
    setSortBy('date');
    setSortOrder('desc');
  };

  const riskColor = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('rendah')) return 'bg-green-100 text-green-800';
    if (lower.includes('sedang')) return 'bg-yellow-100 text-yellow-800';
    if (lower.includes('tinggi')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-black">Memuat riwayat caregiver...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-black">Data caregiver tidak ditemukan.</p>
          <button
            onClick={() => router.push('/caregivers')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 py-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-black">Riwayat Skrining Caregiver</h1>
              <p className="text-sm text-black">
                {data.nama_keluarga} - {data.umur_keluarga} tahun ({data.jenis_kelamin === 1 ? 'Laki-laki' : 'Perempuan'})
              </p>
              <p className="text-xs text-gray-600">Hubungan: {data.hubungan_dengan_pasien}</p>
              {data.doctorName && (
                <p className="text-xs mt-1 inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  Dokter: {data.doctorName}
                  {data.doctorEmail && <span className="text-[10px] text-purple-600 ml-1">{data.doctorEmail}</span>}
                </p>
              )}
              {data.patients.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">Pasien terkait: {data.patients.map(p => p.name).join(', ')}</p>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => router.push('/caregivers')}
                className="flex-1 sm:flex-none px-3 py-2 text-sm text-black border border-gray-300 rounded hover:bg-gray-50"
              >
                Kembali
              </button>
              {data.patients[0] && (
                <button
                  onClick={() => router.push(`/screening/new?caregiverId=${data.id}`)}
                  className="flex-1 sm:flex-none px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Skrining Baru
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-black">Daftar Hasil Skrining</h2>
              <p className="text-xs text-black">Total: {filteredResults.length} dari {data.results.length} hasil</p>
            </div>
            <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800">Clear Filters</button>
          </div>

          <div className="p-3 sm:p-4 border-b bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Cari</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama kuesioner..." className="w-full px-2 py-1 text-sm border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-black mb-1">Tingkat Risiko</label>
                <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                  <option value="all">Semua</option>
                  <option value="Risiko Rendah">Risiko Rendah</option>
                  <option value="Risiko Sedang">Risiko Sedang</option>
                  <option value="Risiko Tinggi">Risiko Tinggi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-black mb-1">Urutkan</label>
                <select value={`${sortBy}-${sortOrder}`} onChange={e => { const [b,o] = e.target.value.split('-'); setSortBy(b as any); setSortOrder(o as any); }} className="w-full px-2 py-1 text-sm border border-gray-300 rounded">
                  <option value="date-desc">Tanggal Terbaru</option>
                  <option value="date-asc">Tanggal Terlama</option>
                  <option value="score-desc">Skor Tertinggi</option>
                  <option value="score-asc">Skor Terendah</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-black mb-1">Periode</label>
                <div className="flex gap-1">
                  <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded" />
                  <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded" />
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {filteredResults.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-black">Tidak ada hasil sesuai filter.</p>
                <button onClick={clearFilters} className="mt-2 text-xs text-blue-600 hover:text-blue-800">Reset</button>
              </div>
            ) : (
              filteredResults.map(r => (
                <div key={r.id} onClick={() => router.push(`/screening/result/${r.id}`)} className="px-3 sm:px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{r.template.title}</h3>
                      <p className="text-xs text-gray-500">
                        {r.patient ? `Pasien: ${r.patient.name}` : 'Tanpa pasien'} • {new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">{r.totalScore} poin</div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${riskColor(r.resultLabel)}`}>{r.resultLabel}</span>
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
