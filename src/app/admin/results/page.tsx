"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';
import { useRole } from '@/lib/useRole';

interface ScreeningResult {
  id: string;
  doctorId: string;
  patient?: { id: string; name: string | null } | null;
  caregiver?: { id: string; nama_keluarga: string | null } | null;
  template?: { id: string; title: string | null } | null;
  totalScore: number;
  resultLabel: string;
  date: string;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'patient' | 'caregiver'>('all');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchResults();
  }, [isAdmin]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch('/api/screening-results', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Gagal mengambil data');
      }
      const data = await res.json();
      setResults(data);
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return results.filter(r => {
      if (filterDoctor && r.doctorId !== filterDoctor) return false;
      if (filterType === 'patient' && !r.patient) return false;
      if (filterType === 'caregiver' && !r.caregiver) return false;
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        const patientName = r.patient?.name?.toLowerCase() || '';
        const caregiverName = (r.caregiver as any)?.nama_keluarga?.toLowerCase() || '';
        const templateTitle = r.template?.title?.toLowerCase() || '';
        if (!patientName.includes(q) && !caregiverName.includes(q) && !templateTitle.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [results, filterDoctor, filterQuery, filterType]);

  const uniqueDoctorIds = useMemo(() => Array.from(new Set(results.map(r => r.doctorId))), [results]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold text-black">Semua Hasil Skrining (Admin)</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-blue-600 hover:text-blue-800">Kembali</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h2 className="font-semibold mb-4 text-black text-sm sm:text-base">Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-black mb-1">Doctor ID</label>
              <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                <option value=''>Semua</option>
                {uniqueDoctorIds.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1">Jenis Subjek</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm">
                <option value='all'>Semua</option>
                <option value='patient'>Pasien</option>
                <option value='caregiver'>Caregiver</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-black mb-1">Cari (pasien / caregiver / kuesioner)</label>
              <input value={filterQuery} onChange={e => setFilterQuery(e.target.value)} placeholder="Ketik untuk cari..." className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
            </div>
            <div className="flex items-end">
              <button onClick={fetchResults} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded">Refresh</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-black">Memuat...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-black">Tidak ada hasil</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-2 font-medium text-black">Tanggal</th>
                    <th className="px-3 py-2 font-medium text-black">Doctor</th>
                    <th className="px-3 py-2 font-medium text-black">Subjek</th>
                    <th className="px-3 py-2 font-medium text-black">Kuesioner</th>
                    <th className="px-3 py-2 font-medium text-black">Skor</th>
                    <th className="px-3 py-2 font-medium text-black">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const subject = r.patient ? r.patient.name : r.caregiver ? (r.caregiver as any).nama_keluarga : '-';
                    return (
                      <tr key={r.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 text-black whitespace-nowrap">{new Date(r.date).toLocaleString()}</td>
                        <td className="px-3 py-2 text-black truncate max-w-[140px]" title={r.doctorId}>{r.doctorId}</td>
                        <td className="px-3 py-2 text-black truncate max-w-[140px]" title={subject || ''}>{subject || '-'}</td>
                        <td className="px-3 py-2 text-black truncate max-w-[160px]" title={r.template?.title || ''}>{r.template?.title || '-'}</td>
                        <td className="px-3 py-2 text-black">{r.totalScore}</td>
                        <td className="px-3 py-2 text-black">{r.resultLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
