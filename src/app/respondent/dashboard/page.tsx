"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TemplateLite { id: string; title: string; description?: string | null; jenis_kuesioner: string; }

export default function RespondentDashboard() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('respondentToken') : null;
    if (!token) { router.push('/respondent/login'); return; }

    (async () => {
      try {
        const res = await fetch('/api/respondent/questionnaires', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401) router.push('/respondent/login');
          throw new Error('Gagal mengambil kuesioner');
        }
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-semibold text-black">Dashboard Responden</h1>
          <div className="space-x-3">
            <button onClick={() => { localStorage.removeItem('respondentToken'); router.push('/respondent/login'); }} className="text-sm text-red-600 hover:underline">Logout</button>
            <button onClick={() => router.push('/respondent/results')} className="text-sm text-blue-600 hover:underline">Riwayat</button>
          </div>
        </header>
        <div className="bg-white rounded shadow p-4">
          {loading && <p className="text-black">Memuat...</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!loading && !error && templates.length === 0 && (
            <p className="text-black text-sm">Belum ada kuesioner tersedia.</p>
          )}
          <ul className="divide-y">
            {templates.map(t => (
              <li key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium text-black">{t.title}</p>
                  {t.description && <p className="text-xs text-gray-600 line-clamp-2 max-w-md">{t.description}</p>}
                  <p className="text-xs text-gray-500 mt-1">Jenis: {t.jenis_kuesioner}</p>
                </div>
                <div className="flex gap-2">
                  {t.jenis_kuesioner === 'Keduanya' ? (
                    <>
                      <button onClick={()=>router.push(`/respondent/fill/${t.id}?as=Pasien`)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Isi sebagai Pasien</button>
                      <button onClick={()=>router.push(`/respondent/fill/${t.id}?as=Caregiver`)} className="px-3 py-1 text-sm bg-purple-600 text-white rounded">Isi sebagai Caregiver</button>
                    </>
                  ) : (
                    <button onClick={()=>router.push(`/respondent/fill/${t.id}?as=${t.jenis_kuesioner}`)} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Isi</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
