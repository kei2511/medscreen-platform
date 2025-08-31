'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken } from '@/lib/auth';

interface Patient {
  id: string;
  name: string;
  age: number;
  results: any[];
  createdAt: string;
}

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  jenis_kuesioner?: 'Pasien' | 'Caregiver' | 'Keduanya';
  questions: any[];
  resultTiers: any[];
  createdAt: string;
}

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ type: 'patient' | 'questionnaire' | null; id: string; name: string }>({ type: null, id: '', name: '' });
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = getAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [patientsRes, questionnairesRes] = await Promise.all([
        fetch('/api/patients', { headers }),
        fetch('/api/questionnaires', { headers })
      ]);

      if (patientsRes.ok && questionnairesRes.ok) {
        const patientsData = await patientsRes.json();
        const questionnairesData = await questionnairesRes.json();
        
        setPatients(patientsData);
        setQuestionnaires(questionnairesData);
        
        // Get doctor info from first response
        if (patientsData.length > 0) {
          const doctorRes = await fetch('/api/auth/me', { headers });
          if (doctorRes.ok) {
            const doctorData = await doctorRes.json();
            setDoctorName(doctorData.name || 'Dokter');
          }
        }
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      removeAuthToken();
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName || !newPatientAge) return;

    try {
      const token = getAuthToken();
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPatientName,
          age: newPatientAge,
        }),
      });

      if (response.ok) {
        setNewPatientName('');
        setNewPatientAge('');
        setShowAddPatient(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/export/csv', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medscreen-results-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push('/');
  };

  const handleDeletePatient = (id: string, name: string) => {
    setDeleteModal({ type: 'patient', id, name });
  };

  const handleDeleteQuestionnaire = (id: string, title: string) => {
    setDeleteModal({ type: 'questionnaire', id, name: title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;

    try {
      const token = getAuthToken();
      const endpoint = deleteModal.type === 'patient' 
        ? `/api/patients/${deleteModal.id}`
        : `/api/questionnaires/${deleteModal.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh data after deletion
        await fetchData();
        setDeleteModal({ type: null, id: '', name: '' });
      } else {
        const error = await response.json();
        alert(`Gagal menghapus: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-black">MedScreen Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-black hidden sm:block">Halo, {doctorName || 'Dokter'}</span>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Patient Management */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-black">Manajemen Pasien</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push('/caregivers')}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Lihat Caregiver
                  </button>
                  <button
                    onClick={() => router.push('/caregivers/new')}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Tambah Caregiver
                  </button>
                  <button
                    onClick={() => router.push('/patients/new')}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Tambah Pasien
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {patients.length === 0 ? (
                <p className="text-black text-center py-8">Belum ada pasien terdaftar</p>
              ) : (
                <div className="space-y-3">
                  {patients.map((patient) => (
                    <div key={patient.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-black truncate">{patient.name}</h3>
                          <p className="text-sm text-black">Umur: {patient.age} tahun</p>
                          <p className="text-sm text-black">
                            {patient.results.length} skrining dilakukan
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                          <button
                            onClick={() => router.push(`/patient/${patient.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors text-left sm:text-center"
                          >
                            Lihat Riwayat
                          </button>
                          <button
                            onClick={() => router.push(`/screening/new?patientId=${patient.id}`)}
                            className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded hover:bg-green-50 transition-colors text-left sm:text-center"
                          >
                            Mulai Skrining
                          </button>
                          <button
                            onClick={() => handleDeletePatient(patient.id, patient.name)}
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
              
              {patients.length > 0 && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => router.push('/screening/new')}
                    className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 text-sm sm:text-base"
                  >
                    Mulai Skrining Baru
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full bg-green-600 text-white py-2.5 px-4 rounded-md hover:bg-green-700 text-sm sm:text-base"
                  >
                    Ekspor Semua Data ke CSV
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Questionnaire Templates */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-black">Template Kuesioner</h2>
                <button
                  onClick={() => router.push('/questionnaires/new')}
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Buat Kuesioner
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {questionnaires.length === 0 ? (
                <p className="text-black text-center py-6 sm:py-8 text-sm sm:text-base">Belum ada kuesioner dibuat</p>
              ) : (
                <div className="space-y-3">
                  {questionnaires.map((questionnaire) => (
                    <div key={questionnaire.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-black text-sm sm:text-base">{questionnaire.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs sm:text-sm text-black">
                          {questionnaire.questions.length} pertanyaan
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {questionnaire.jenis_kuesioner || 'Pasien'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2 mt-2">
                        <button
                          onClick={() => router.push(`/questionnaires/${questionnaire.id}/edit`)}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Edit Kuesioner
                        </button>
                        <button
                          onClick={() => handleDeleteQuestionnaire(questionnaire.id, questionnaire.title)}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Patient Modal */}
        {showAddPatient && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-0 shadow-lg">
              <h3 className="text-lg font-semibold text-black mb-4">Tambah Pasien Baru</h3>
              <form onSubmit={handleAddPatient}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Nama Pasien
                    </label>
                    <input
                      type="text"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base"
                      required
                      placeholder="Masukkan nama pasien"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Umur
                    </label>
                    <input
                      type="number"
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm sm:text-base"
                      required
                      min="1"
                      max="120"
                      placeholder="Masukkan umur"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddPatient(false)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.type && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-0 shadow-lg">
              <h3 className="text-lg font-semibold text-black mb-4">
                Konfirmasi Hapus
              </h3>
              <p className="text-black mb-6">
                Apakah Anda yakin ingin menghapus {deleteModal.type === 'patient' ? 'pasien' : 'kuesioner'} "{deleteModal.name}"?
                {deleteModal.type === 'patient' && (
                  <span className="block mt-2 text-sm text-red-600">
                    Semua data skrining yang terkait dengan pasien ini juga akan dihapus.
                  </span>
                )}
                {deleteModal.type === 'questionnaire' && (
                  <span className="block mt-2 text-sm text-red-600">
                    Semua hasil skrining yang menggunakan kuesioner ini juga akan dihapus.
                  </span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ type: null, id: '', name: '' })}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
