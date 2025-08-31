'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface Caregiver {
  id: string;
  nama_keluarga: string;
  jenis_kelamin: number;
  umur_keluarga: number;
  hubungan_dengan_pasien: string;
  patients: {
    id: string;
    name: string;
  }[];
  createdAt: string;
}

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const fetchCaregivers = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/caregivers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCaregivers(data);
      } else {
        setError('Gagal memuat data caregiver');
      }
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCaregiver = async (caregiverId: string, caregiverName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus caregiver "${caregiverName}"?`)) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/caregivers/${caregiverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCaregivers(prev => prev.filter(c => c.id !== caregiverId));
        setSuccess('Caregiver berhasil dihapus');
      } else {
        if (data.error && data.error.includes('pasien terkait')) {
          setError(`Tidak dapat menghapus caregiver: ${data.error}`);
        } else {
          setError(data.error || 'Gagal menghapus caregiver');
        }
      }
    } catch (error) {
      console.error('Error deleting caregiver:', error);
      setError('Terjadi kesalahan saat menghapus caregiver');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data caregiver...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 py-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Daftar Caregiver</h1>
              <p className="text-sm text-gray-600">Kelola data keluarga/caregiver pasien</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 sm:flex-none px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Kembali ke Dashboard
              </button>
              <button
                onClick={() => router.push('/caregivers/new')}
                className="flex-1 sm:flex-none px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Tambah Caregiver
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Caregiver ({caregivers.length})
            </h2>
          </div>
          
          <div className="p-6">
            {caregivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Belum ada caregiver terdaftar</p>
                <button
                  onClick={() => router.push('/caregivers/new')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Tambah Caregiver Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {caregivers.map((caregiver) => (
                  <div key={caregiver.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {caregiver.nama_keluarga}
                        </h3>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          <p>
                            Jenis Kelamin: {caregiver.jenis_kelamin === 1 ? 'Laki-laki' : 'Perempuan'}
                          </p>
                          <p>Umur: {caregiver.umur_keluarga} tahun</p>
                          <p>Hubungan: {caregiver.hubungan_dengan_pasien}</p>
                          <p>Jumlah Pasien: {caregiver.patients?.length || 0} pasien</p>
                        </div>
                        {caregiver.patients && caregiver.patients.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Pasien terkait:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {caregiver.patients.map((patient) => (
                                <span
                                  key={patient.id}
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                >
                                  {patient.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        <button
                          onClick={() => router.push(`/caregivers/${caregiver.id}/edit`)}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors text-left sm:text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCaregiver(caregiver.id, caregiver.nama_keluarga)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors text-left sm:text-center"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 