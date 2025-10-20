'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { computeCalories, CalorieInput } from '@/lib/calorie';
import { getAuthToken } from '@/lib/auth';

interface Person {
  id: string;
  name: string;
  age: number;
  type: 'patient' | 'caregiver';
  jenis_kelamin?: number;
}

interface CalorieCalculation {
  id: string;
  gender: string;
  heightCm: number;
  weightKg: number;
  age: number;
  activity: string;
  result: any;
  createdAt: string;
  patient?: {
    name: string;
  };
  caregiver?: {
    nama_keluarga: string;
  };
}

export default function CaloriePage() {
  const router = useRouter();
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [height, setHeight] = useState<string>('170');
  const [weight, setWeight] = useState<string>('70');
  const [age, setAge] = useState<string>('30');
  const [activity, setActivity] = useState<'Istirahat' | 'Ringan' | 'Sedang' | 'Berat'>('Ringan');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<CalorieCalculation[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [menuImage, setMenuImage] = useState<string | null>(null);

  // Function to determine which menu image to show based on calorie result
  const getMenuImageForCalories = (calories: number): string => {
    // Range mapping for different menu images
    // For example: 1051-1150 uses 1100.jpg, 1251-1350 uses 1300.jpg, 1851-1950 uses 1900.jpg
    if (calories >= 1001 && calories <= 1100) {
      return '/pictures/1100.jpg'; // Image for 1100 calories range
    } else if (calories >= 1201 && calories <= 1300) {
      return '/pictures/1300.jpg'; // Image for 1300 calories range
    } else if (calories >= 1801 && calories <= 1900) {
      return '/pictures/1900.jpg'; // Image for 1900 calories range
    }
    
    // Default fallback if no specific range matches
    return '/pictures/1900.jpg';
  };

  // Effect to update menu image when result changes
  useEffect(() => {
    if (result && result.totalRounded) {
      const image = getMenuImageForCalories(result.totalRounded);
      setMenuImage(image);
    } else {
      setMenuImage(null);
    }
  }, [result]);

  // Fetch patients and caregivers
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setError('Tidak ditemukan token otentikasi');
          return;
        }
        
        const response = await fetch('/api/patients-caregivers', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data pasien dan caregiver');
        }
        
        const data = await response.json();
        setPeople(data.allPeople);
      } catch (error: any) {
        setError(error.message || 'Terjadi kesalahan saat mengambil data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPeople();
  }, []);

  // Fetch history when a person is selected
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedPerson) {
        setHistory([]);
        return;
      }
      
      try {
        setHistoryLoading(true);
        const token = getAuthToken();
        if (!token) {
          console.error('Tidak ditemukan token otentikasi');
          return;
        }
        
        // Determine the type of the selected person
        const person = people.find(p => p.id === selectedPerson);
        if (!person) return;
        
        const response = await fetch(`/api/calorie-calculations?targetId=${selectedPerson}&targetType=${person.type}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Gagal mengambil riwayat perhitungan kalori');
        }
        
        const data = await response.json();
        setHistory(data);
      } catch (error: any) {
        console.error('Error saat mengambil riwayat:', error);
      } finally {
        setHistoryLoading(false);
      }
    };
    
    fetchHistory();
  }, [selectedPerson, people]);

  // Update form fields when a person is selected
  useEffect(() => {
    if (selectedPerson) {
      const person = people.find(p => p.id === selectedPerson);
      if (person) {
        // Set age based on the selected person
        setAge(person.age.toString());
        // Set gender based on the selected person if available
        if (person.jenis_kelamin !== undefined) {
          setGender(person.jenis_kelamin === 1 ? 'Laki-laki' : 'Perempuan');
        }
      }
    }
  }, [selectedPerson, people]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (!selectedPerson) {
        setError('Silakan pilih pasien atau caregiver terlebih dahulu');
        return;
      }
      
      const input: CalorieInput = {
        gender,
        heightCm: Number(height),
        weightKg: Number(weight),
        age: Number(age),
        activity,
      };
      const res = computeCalories(input);
      setResult(res);
      
      // Save to history
      saveToHistory(input, res);
    } catch (err: any) {
      setError(err?.message || 'Input tidak valid');
      setResult(null);
    }
  };

  const saveToHistory = async (input: CalorieInput, result: any) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('Tidak ditemukan token otentikasi');
        return;
      }
      
      // Determine if the selected person is a patient or caregiver
      const person = people.find(p => p.id === selectedPerson);
      if (!person) {
        console.error('Tidak ditemukan orang yang dipilih');
        return;
      }
      
      console.log('Attempting to save calorie calculation:', {
        targetId: selectedPerson,
        targetType: person.type,
        input,
        result
      }); // Debug log
      
      const response = await fetch('/api/calorie-calculations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: selectedPerson,
          targetType: person.type,
          ...input,
          result: {
            ...result,
            // Include the calculation parameters for reference
            inputParams: {
              heightCm: input.heightCm,
              weightKg: input.weightKg,
              age: input.age,
              activity: input.activity,
              gender: input.gender
            }
          },
        }),
      });
      
      console.log('Save response status:', response.status); // Debug log
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gagal menyimpan ke riwayat:', errorText);
      } else {
        // Refresh history after saving
        const newCalculation = await response.json();
        console.log('Successfully saved calculation:', newCalculation); // Debug log
        setHistory(prev => [newCalculation, ...prev]);
      }
    } catch (error) {
      console.error('Error saat menyimpan ke riwayat:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-black">Kalkulator Kebutuhan Kalori</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Kembali
          </button>
        </div>

        {/* Person Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-black">Pilih Pasien atau Caregiver</label>
          {loading ? (
            <div className="mt-2 text-gray-500">Memuat data...</div>
          ) : (
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full mt-2 p-2 border rounded"
            >
              <option value="">Pilih pasien atau caregiver</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.type === 'patient' ? 'Pasien' : 'Caregiver'}, {person.age} tahun)
                </option>
              ))}
            </select>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-black">Jenis Kelamin</label>
            <div className="flex gap-4 mt-2">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="gender" 
                  checked={gender === 'Laki-laki'} 
                  onChange={() => setGender('Laki-laki')} 
                />
                <span className="ml-2 text-black">Laki-laki</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="gender" 
                  checked={gender === 'Perempuan'} 
                  onChange={() => setGender('Perempuan')} 
                />
                <span className="ml-2 text-black">Perempuan</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-black">Tinggi Badan (cm)</label>
            <input 
              type="number" 
              value={height} 
              onChange={(e) => setHeight(e.target.value)} 
              className="w-full mt-2 p-2 border rounded" 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black">Berat Badan (kg)</label>
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              className="w-full mt-2 p-2 border rounded" 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black">Usia (tahun)</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              className="w-full mt-2 p-2 border rounded" 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black">Tingkat Aktivitas</label>
            <select 
              value={activity} 
              onChange={(e) => setActivity(e.target.value as any)} 
              className="w-full mt-2 p-2 border rounded"
            >
              <option value="Istirahat">Istirahat</option>
              <option value="Ringan">Ringan</option>
              <option value="Sedang">Sedang</option>
              <option value="Berat">Berat</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Hitung Kalori</button>
            <button 
              type="button" 
              onClick={() => { 
                setResult(null); 
                setError(null);
                setSelectedPerson('');
              }} 
              className="px-4 py-2 bg-gray-200 rounded text-black"
            >
              Reset
            </button>
          </div>
        </form>

        {error && <div className="mt-4 text-red-600">{error}</div>}

        {result && (
          <div className="mt-6 bg-gray-50 p-4 rounded">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-800">{result.totalRounded} Kalori</div>
              <div className="text-sm text-gray-600">Total kebutuhan kalori harian</div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-white border rounded">
                <div className="font-medium text-black">BBI</div>
                <div className="text-black">{result.bbi} kg</div>
              </div>
              <div className="p-3 bg-white border rounded">
                <div className="font-medium text-black">Kalori Basal (KKB)</div>
                <div className="text-black">{result.kkb} kkal</div>
              </div>
              <div className="p-3 bg-white border rounded">
                <div className="font-medium text-black">Faktor Usia</div>
                <div className="text-black">{result.factorAge} kkal</div>
              </div>
              <div className="p-3 bg-white border rounded">
                <div className="font-medium text-black">Faktor Aktivitas</div>
                <div className="text-black">{result.factorActivity} kkal</div>
              </div>
              <div className="p-3 bg-white border rounded sm:col-span-2">
                <div className="font-medium text-black">Faktor Berat</div>
                <div className="text-black">{result.factorWeight} kkal (IMT: {result.bmi})</div>
              </div>
            </div>

            {/* Menu Image Display */}
            {menuImage && (
              <div className="mt-6">
                <h3 className="text-center text-lg font-semibold text-black mb-3">Menu Makanan Disarankan</h3>
                <div className="flex justify-center">
                  <img 
                    src={menuImage} 
                    alt={`Menu untuk kebutuhan kalori ${result.totalRounded}`} 
                    className="max-w-full h-auto rounded-lg border"
                    onError={(e) => {
                      console.error(`Error loading image: ${menuImage}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Section */}
        {selectedPerson && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-black mb-4">Riwayat Perhitungan Kalori</h2>
            {historyLoading ? (
              <div className="text-center py-4 text-gray-500">Memuat riwayat...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Belum ada riwayat perhitungan untuk {people.find(p => p.id === selectedPerson)?.name}</div>
            ) : (
              <div className="space-y-4">
                {history.map((calculation) => (
                  <div key={calculation.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-black">{calculation.result.totalRounded} Kalori</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(calculation.createdAt)} • {calculation.gender} • {calculation.age} tahun
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {calculation.activity}
                      </span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium text-black">Tinggi</div>
                        <div className="text-black">{calculation.heightCm} cm</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium text-black">Berat</div>
                        <div className="text-black">{calculation.weightKg} kg</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium text-black">BBI</div>
                        <div className="text-black">{calculation.result.bbi} kg</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-medium text-black">IMT</div>
                        <div className="text-black">{calculation.result.bmi}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
