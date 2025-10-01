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
  caregiverId?: string;
  caregiver?: {
    id: string;
    nama_keluarga: string;
  };
}

interface Caregiver {
  id: string;
  nama_keluarga: string;
  jenis_kelamin: number;
  umur_keluarga: number;
  hubungan_dengan_pasien: string;
}

export default function EditPatient() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    jenis_kelamin: 1,
    umur_pasien: '',
    lama_menderita_dm: '',
    penyakit_lain: '',
    caregiverId: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    fetchCaregivers();
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
        setFormData({
          name: data.name || '',
          age: data.age?.toString() || '',
          jenis_kelamin: data.jenis_kelamin || 1,
          umur_pasien: data.umur_pasien?.toString() || '',
          lama_menderita_dm: data.lama_menderita_dm?.toString() || '',
          penyakit_lain: data.penyakit_lain || '',
          caregiverId: data.caregiverId || ''
        });
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

  const fetchCaregivers = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/caregivers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCaregivers(data || []);
      }
    } catch (error) {
      console.error('Error fetching caregivers:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age) || 0,
          jenis_kelamin: parseInt(formData.jenis_kelamin.toString()),
          umur_pasien: formData.umur_pasien ? parseInt(formData.umur_pasien) : null,
          lama_menderita_dm: formData.lama_menderita_dm ? parseFloat(formData.lama_menderita_dm) : null,
          penyakit_lain: formData.penyakit_lain || null,
          caregiverId: formData.caregiverId || null
        }),
      });

      if (response.ok) {
        alert('Data pasien berhasil diperbarui!');
        router.push(`/patient/${patientId}`);
      } else {
        const error = await response.json();
        alert(`Gagal memperbarui data: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSaving(false);
    }
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
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg sm:text-xl font-semibold text-black">Edit Data Pasien</h1>
            <button
              onClick={() => router.push(`/patient/${patientId}`)}
              className="text-black hover:text-black px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Nama Pasien *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Masukkan nama pasien"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Umur *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                  max="120"
                  placeholder="Masukkan umur"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Jenis Kelamin *
              </label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={1}>Laki-laki</option>
                <option value={0}>Perempuan</option>
              </select>
            </div>

            {/* Additional Patient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Umur Pasien (Detail)
                </label>
                <input
                  type="number"
                  name="umur_pasien"
                  value={formData.umur_pasien}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="120"
                  placeholder="Umur detail (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Lama Menderita DM (tahun)
                </label>
                <input
                  type="number"
                  name="lama_menderita_dm"
                  value={formData.lama_menderita_dm}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.1"
                  min="0"
                  placeholder="Contoh: 2.5"
                />
              </div>
            </div>

            {/* Other Diseases */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Penyakit Lain
              </label>
              <textarea
                name="penyakit_lain"
                value={formData.penyakit_lain}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Sebutkan penyakit lain yang diderita (opsional)"
              />
            </div>

            {/* Caregiver Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Caregiver
              </label>
              <select
                name="caregiverId"
                value={formData.caregiverId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tidak ada caregiver</option>
                {caregivers.map((caregiver) => (
                  <option key={caregiver.id} value={caregiver.id}>
                    {caregiver.nama_keluarga} ({caregiver.hubungan_dengan_pasien}, {caregiver.umur_keluarga} tahun)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Pilih caregiver jika pasien memiliki pendamping
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
              <button
                type="button"
                onClick={() => router.push(`/patient/${patientId}`)}
                className="w-full sm:w-auto px-4 py-2 text-black hover:text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}