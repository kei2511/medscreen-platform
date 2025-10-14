'use client';

import React, { useState } from 'react';
import { computeCalories, CalorieInput } from '@/lib/calorie';

export default function CaloriePage() {
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [height, setHeight] = useState<string>('170');
  const [weight, setWeight] = useState<string>('70');
  const [age, setAge] = useState<string>('30');
  const [activity, setActivity] = useState<'Istirahat' | 'Ringan' | 'Sedang' | 'Berat'>('Ringan');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const input: CalorieInput = {
        gender,
        heightCm: Number(height),
        weightKg: Number(weight),
        age: Number(age),
        activity,
      };
      const res = computeCalories(input);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Input tidak valid');
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-bold mb-4">Kalkulator Kebutuhan Kalori</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Jenis Kelamin</label>
            <div className="flex gap-4 mt-2">
              <label className="inline-flex items-center">
                <input type="radio" name="gender" checked={gender === 'Laki-laki'} onChange={() => setGender('Laki-laki')} />
                <span className="ml-2">Laki-laki</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="gender" checked={gender === 'Perempuan'} onChange={() => setGender('Perempuan')} />
                <span className="ml-2">Perempuan</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tinggi Badan (cm)</label>
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full mt-2 p-2 border rounded" />
          </div>

          <div>
            <label className="text-sm font-medium">Berat Badan (kg)</label>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full mt-2 p-2 border rounded" />
          </div>

          <div>
            <label className="text-sm font-medium">Usia (tahun)</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full mt-2 p-2 border rounded" />
          </div>

          <div>
            <label className="text-sm font-medium">Tingkat Aktivitas</label>
            <select value={activity} onChange={(e) => setActivity(e.target.value as any)} className="w-full mt-2 p-2 border rounded">
              <option value="Istirahat">Istirahat (Sangat jarang atau tidak pernah olahraga)</option>
              <option value="Ringan">Ringan (Olahraga 1-3 kali/minggu)</option>
              <option value="Sedang">Sedang (Olahraga 3-5 kali/minggu)</option>
              <option value="Berat">Berat (Olahraga 6-7 kali/minggu)</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Hitung Kalori</button>
            <button type="button" onClick={() => { setResult(null); setError(null); }} className="px-4 py-2 bg-gray-200 rounded">Reset</button>
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
                <div className="font-medium">BBI</div>
                <div>{result.bbi} kg</div>
              </div>
              <div className="p-3 bg-white border rounded">
                <div className="font-medium">Kalori Basal (KKB)</div>
                <div>{result.kkb} kkal</div>
              </div>
              <div className="p-3 bg-white border rounded">
                <div className="font-medium">Faktor Usia</div>
                <div>{result.factorAge} kkal</div>
              </div>
              <div className="p-3 bg-white border rounded">
                <div className="font-medium">Faktor Aktivitas</div>
                <div>{result.factorActivity} kkal</div>
              </div>
              <div className="p-3 bg-white border rounded sm:col-span-2">
                <div className="font-medium">Faktor Berat</div>
                <div>{result.factorWeight} kkal (IMT: {result.bmi})</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
