"use client";
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';

interface QuestionOption { text: string; score?: number; type?: string; }
interface Question { text: string; type: string; options?: QuestionOption[]; textPlaceholder?: string; }
interface Template { id: string; title: string; description?: string; questions: Question[]; jenis_kuesioner: string; resultTiers?: any; }

export default function FillQuestionnairePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const templateId = params.id as string;
  const fillAs = searchParams.get('as');
  const [template, setTemplate] = useState<Template | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const token = useMemo(()=> (typeof window !== 'undefined' ? localStorage.getItem('respondentToken') : null), []);

  useEffect(()=> {
    if (!token) { router.push('/respondent/login'); return; }
  }, [token, router]);

  useEffect(()=> {
    let active = true;
    (async ()=> {
      try {
        setLoading(true);
        const res = await fetch(`/api/respondent/questionnaires/${templateId}`, { headers: { Authorization: `Bearer ${token}` }});
        if (!res.ok) throw new Error('Gagal memuat kuesioner');
        const data = await res.json();
        if (!data.template) throw new Error('Kuesioner tidak ditemukan');
        setTemplate(data.template);
      } catch (e:any) {
        if (active) setError(e.message);
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [templateId, token]);

  const handleSelect = (qIndex: number, option: any, multi: boolean) => {
    setAnswers(prev => {
      const clone = [...prev];
      let entry = clone.find(a => a.questionIndex === qIndex);
      if (!entry) { entry = { questionIndex: qIndex, selected: null, selectedOptions: [], type: template?.questions[qIndex].type }; clone.push(entry); }
      if (multi) {
        const exists = entry.selectedOptions.some((o: any) => o.text === option.text);
        entry.selectedOptions = exists ? entry.selectedOptions.filter((o: any) => o.text !== option.text) : [...entry.selectedOptions, option];
      } else {
        entry.selected = option;
      }
      return clone;
    });
  };

  const handleText = (qIndex: number, value: string) => {
    setAnswers(prev => {
      const clone = [...prev];
      let entry = clone.find(a => a.questionIndex === qIndex);
      if (!entry) { entry = { questionIndex: qIndex, value, type: template?.questions[qIndex].type }; clone.push(entry); }
      else entry.value = value;
      return clone;
    });
  };

  const submit = async () => {
    if (!template) return;
    if (!fillAs) { alert('Parameter peran (as) hilang'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/respondent/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId: template.id, fillAs, answers })
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'Gagal submit'}));
        alert(err.error || 'Gagal submit');
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert('Error saat submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="p-6 text-black">Memuat...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!template) return <div className="p-6 text-black">Template tidak ditemukan</div>;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-semibold text-black">Hasil Pengisian</h1>
        <p className="text-black">Total Skor: <span className="font-bold">{result.totalScore}</span></p>
        {result.resultLabel && (
          <div className="border rounded p-4 bg-white">
            <p className="font-medium text-black">{result.resultLabel}</p>
            {result.recommendation && <p className="text-sm text-gray-600 mt-1">{result.recommendation}</p>}
          </div>
        )}
        <button onClick={()=> router.push('/respondent/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded">Kembali ke Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-black">{template.title}</h1>
        <button onClick={()=>router.back()} className="text-sm text-blue-600 hover:underline">Kembali</button>
      </div>
      {template.description && <p className="text-sm text-gray-700">{template.description}</p>}
      {!template.questions?.length && (
        <p className="text-sm text-red-600">Tidak ada pertanyaan pada kuesioner ini.</p>
      )}
      <div className="space-y-4">
        {template.questions?.map((q, idx) => {
          if (q.type === 'multiple_choice' || q.type === 'multiple_selection') {
            const answer = answers.find(a => a.questionIndex === idx) || {};
            const multi = q.type === 'multiple_selection';
            return (
              <div key={idx} className="border rounded p-4 bg-white">
                <p className="font-medium text-black mb-2">{idx + 1}. {q.text}</p>
                <div className="space-y-2">
                  {q.options?.map((opt, oIdx) => {
                    const checked = multi ? (answer.selectedOptions || []).some((o: any) => o.text === opt.text) : answer.selected?.text === opt.text;
                    return (
                      <label key={oIdx} className="flex items-center space-x-2 text-sm text-black">
                        <input type={multi ? 'checkbox' : 'radio'} checked={checked} onChange={()=>handleSelect(idx, opt, multi)} />
                        <span>{opt.text} {typeof opt.score === 'number' && <span className="text-gray-500">({opt.score})</span>}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }
          // text_input
          const answer = answers.find(a => a.questionIndex === idx) || {};
          return (
            <div key={idx} className="border rounded p-4 bg-white">
              <p className="font-medium text-black mb-2">{idx + 1}. {q.text}</p>
              <input type="text" value={answer.value || ''} onChange={e=>handleText(idx, e.target.value)} placeholder={q.textPlaceholder || 'Jawaban...'} className="w-full border px-3 py-2 rounded text-sm" />
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <button disabled={submitting} onClick={submit} className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50">{submitting ? 'Mengirim...' : 'Kirim'}</button>
      </div>
    </div>
  );
}
