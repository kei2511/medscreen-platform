'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthToken } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegistering 
        ? { email, password, name }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!isRegistering) {
        setAuthToken(data.token);
        router.push('/dashboard');
      } else {
        setIsRegistering(false);
        setName('');
        setError('Registration successful! Please login with your credentials.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-md w-full mx-2 sm:mx-0">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4">
            <img src="/logoSicarebet.png" alt="Logo SiCarAbet" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">SiCarAbet</h1>
          <p className="text-sm sm:text-base text-gray-600">Aplikasi Caring for Diabetes</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-center text-black mb-4 sm:mb-6">
            {isRegistering ? 'Daftar Akun Baru' : 'Masuk ke Akun'}
          </h2>

          {error && (
            <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-md text-xs sm:text-sm ${error.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-black"
                  required={isRegistering}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-black"
                required
                placeholder="Masukkan email"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base text-black"
                required
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base transition-colors"
            >
              {isLoading ? 'Memproses...' : (isRegistering ? 'Daftar' : 'Masuk')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm transition-colors"
            >
              {isRegistering ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
