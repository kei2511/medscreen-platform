"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RespondentRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    patientName: '',
    patientAge: '',
    patientGender: '',
    caregiverName: '',
    caregiverRelation: ''
  });
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.email || !form.password || !form.patientName) {
      alert('Email, password dan nama pasien wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/respondent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
            password: form.password,
            name: form.name || undefined,
            patient: {
              name: form.patientName,
              age: form.patientAge ? Number(form.patientAge) : undefined,
              gender: form.patientGender || undefined
            },
            caregiver: form.caregiverName ? {
              name: form.caregiverName,
              relation: form.caregiverRelation || undefined
            } : undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('respondentToken', data.token);
        router.push('/respondent/dashboard');
      } else {
        const err = await res.json().catch(()=>({error:'Gagal'}));
        alert(err.error || 'Gagal register');
      }
    } catch (e) {
      console.error(e);
      alert('Error jaringan');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6 space-y-6">
        <h1 className="text-xl font-semibold text-black">Registrasi Responden</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Email *</label>
            <input value={form.email} onChange={e=>update('email', e.target.value)} type="email" className="w-full border px-3 py-2 rounded" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Password *</label>
            <input value={form.password} onChange={e=>update('password', e.target.value)} type="password" className="w-full border px-3 py-2 rounded" placeholder="••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Nama (Opsional)</label>
            <input value={form.name} onChange={e=>update('name', e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>

          <div className="pt-2 border-t">
            <p className="font-medium text-black mb-2">Data Pasien</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1 text-black">Nama Pasien *</label>
                <input value={form.patientName} onChange={e=>update('patientName', e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-black">Usia</label>
                  <input type="number" value={form.patientAge} onChange={e=>update('patientAge', e.target.value)} className="w-full border px-3 py-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-black">Jenis Kelamin</label>
                  <select value={form.patientGender} onChange={e=>update('patientGender', e.target.value)} className="w-full border px-3 py-2 rounded">
                    <option value="">-</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="font-medium text-black mb-2">Data Caregiver (Opsional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1 text-black">Nama Caregiver</label>
                <input value={form.caregiverName} onChange={e=>update('caregiverName', e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-black">Relasi</label>
                <input value={form.caregiverRelation} onChange={e=>update('caregiverRelation', e.target.value)} className="w-full border px-3 py-2 rounded" placeholder="Istri / Anak / ..." />
              </div>
            </div>
          </div>

          <button disabled={loading} onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium disabled:opacity-50">
            {loading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
          <p className="text-sm text-center text-black">Sudah punya akun? <button onClick={()=>router.push('/respondent/login')} className="text-blue-600 hover:underline">Login</button></p>
        </div>
      </div>
    </div>
  );
}
