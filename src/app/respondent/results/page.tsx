"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubmissionItem { id:string; totalScore:number; resultLabel?:string|null; recommendation?:string|null; template?: { title:string; jenis_kuesioner:string }; createdAt?:string }

export default function RespondentResultsPage(){
  const router = useRouter();
  const [subs, setSubs] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(()=>{
    const token = typeof window !== 'undefined' ? localStorage.getItem('respondentToken') : null;
    if(!token){ router.push('/respondent/login'); return; }
    (async ()=>{
      try {
        const res = await fetch('/api/respondent/submissions', { headers:{ Authorization: `Bearer ${token}` }});
        if(!res.ok){ if(res.status===401) router.push('/respondent/login'); throw new Error('Gagal memuat hasil'); }
        const data = await res.json();
        setSubs(data.submissions || []);
      }catch(e:any){ setError(e.message||'Error'); }
      finally{ setLoading(false); }
    })();
  },[router]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-semibold text-black">Riwayat Pengisian</h1>
          <button onClick={()=>router.push('/respondent/dashboard')} className="text-sm text-blue-600 hover:underline">Kembali</button>
        </header>
        <div className="bg-white rounded shadow p-4">
          {loading && <p className="text-black">Memuat...</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!loading && !error && subs.length === 0 && (
            <p className="text-black text-sm">Belum ada hasil.</p>
          )}
          <ul className="divide-y">
            {subs.map(s => (
              <li key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium text-black">{s.template?.title || 'Kuesioner'}</p>
                  <p className="text-xs text-gray-500">Jenis: {s.template?.jenis_kuesioner}</p>
                  <p className="text-xs text-gray-500">Skor: {s.totalScore}{s.resultLabel && <> • <span className="text-green-700">{s.resultLabel}</span></>}</p>
                  {s.recommendation && <p className="text-xs text-gray-600 mt-1 line-clamp-2 max-w-md">{s.recommendation}</p>}
                </div>
                <div className="text-xs text-gray-500">ID: {s.id}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
