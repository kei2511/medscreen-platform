"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RespondentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { alert('Lengkapi email & password'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/respondent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('respondentToken', data.token);
        router.push('/respondent/dashboard');
      } else {
        const err = await res.json().catch(()=>({error:'Gagal login'}));
        alert(err.error || 'Gagal login');
      }
    } catch (e) {
      console.error(e);
      alert('Error jaringan');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-6">
        <h1 className="text-xl font-semibold text-black">Login Responden</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border px-3 py-2 rounded" />
          </div>
          <button disabled={loading} onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-medium disabled:opacity-50">
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
          <p className="text-sm text-center text-black">Belum punya akun? <button onClick={()=>router.push('/respondent/register')} className="text-blue-600 hover:underline">Daftar</button></p>
        </div>
      </div>
    </div>
  );
}
