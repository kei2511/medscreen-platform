'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'multiple_selection' | 'text_input';
  options?: {
    id: string;
    text: string;
    score: number;
    type: 'fixed' | 'custom';
  }[];
  textPlaceholder?: string;
}

interface ResultTier {
  id: string;
  minScore: number;
  maxScore: number;
  label: string;
  recommendation: string;
}

export default function NewQuestionnaire() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jenisKuesioner, setJenisKuesioner] = useState<'Pasien' | 'Caregiver' | 'Keduanya'>('Pasien');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultTiers, setResultTiers] = useState<ResultTier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const addQuestion = (type: 'multiple_choice' | 'multiple_selection' | 'text_input') => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type,
      ...(type === 'multiple_choice' || type === 'multiple_selection' ? {
        options: [{ id: Date.now().toString(), text: '', score: 0, type: 'fixed' as const }]
      } : {
        textPlaceholder: 'Masukkan jawaban...'
      })
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId: string, text: string) => {
    setQuestions(questions.map((q: Question) => 
      q.id === questionId ? { ...q, text } : q
    ));
  };

  const updateQuestionType = (questionId: string, type: 'multiple_choice' | 'multiple_selection' | 'text_input') => {
    setQuestions(questions.map((q: Question) => {
      if (q.id === questionId) {
        const updatedQuestion: Question = {
          ...q,
          type: type,
          ...(type === 'multiple_choice' || type === 'multiple_selection' ? {
            options: q.options || [{ id: Date.now().toString(), text: '', score: 0, type: 'fixed' as const }]
          } : {
            options: undefined,
            textPlaceholder: q.textPlaceholder || 'Masukkan jawaban...'
          })
        };
        return updatedQuestion;
      }
      return q;
    }));
  };

  const updateTextPlaceholder = (questionId: string, placeholder: string) => {
    setQuestions(questions.map((q: Question) => 
      q.id === questionId ? { ...q, textPlaceholder: placeholder } : q
    ));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId ? {
        ...q,
        options: [...(q.options || []), { id: Date.now().toString(), text: '', score: 0, type: 'fixed' as const }]
      } : q
    ));
  };

  const updateOption = (questionId: string, optionId: string, field: 'text' | 'score' | 'type', value: string | number) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {
        ...q,
        options: q.options?.map(opt => 
          opt.id === optionId ? { ...opt, [field]: value } : opt
        )
      } : q
    ));
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId ? {
        ...q,
        options: (q.options || []).filter(opt => opt.id !== optionId)
      } : q
    ));
  };

  const addResultTier = () => {
    setResultTiers([...resultTiers, {
      id: Date.now().toString(),
      minScore: 0,
      maxScore: 0,
      label: '',
      recommendation: ''
    }]);
  };

  const updateResultTier = (tierId: string, field: keyof ResultTier, value: string | number) => {
    setResultTiers(resultTiers.map(tier => 
      tier.id === tierId ? { ...tier, [field]: value } : tier
    ));
  };

  const removeResultTier = (tierId: string) => {
    setResultTiers(resultTiers.filter(tier => tier.id !== tierId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = getAuthToken();
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          jenis_kuesioner: jenisKuesioner,
          questions: questions.map(q => ({
            text: q.text,
            type: q.type,
            options: (q.type === 'multiple_choice' || q.type === 'multiple_selection') ? (q.options || []).map(opt => ({
              text: opt.text,
              score: Number(opt.score),
              type: opt.type
            })) : undefined,
            textPlaceholder: q.type === 'text_input' ? (q.textPlaceholder || 'Masukkan jawaban...') : undefined
          })),
          resultTiers: resultTiers.map(tier => ({
            minScore: Number(tier.minScore),
            maxScore: Number(tier.maxScore),
            label: tier.label,
            recommendation: tier.recommendation
          }))
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to create questionnaire');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      alert('Gagal membuat kuesioner');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg sm:text-xl font-semibold text-black">Buat Kuesioner Baru</h1>
            <button
              onClick={() => window.history.back()}
              className="text-black hover:text-black px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Informasi Dasar</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                  Judul Kuesioner *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                  placeholder="Contoh: Skrining Depresi Hamilton"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  rows={3}
                  placeholder="Jelaskan tujuan dan konteks penggunaan kuesioner ini"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                  Jenis Kuesioner *
                </label>
                <select
                  value={jenisKuesioner}
                  onChange={(e) => setJenisKuesioner(e.target.value as 'Pasien' | 'Caregiver' | 'Keduanya')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  required
                >
                  <option value="Pasien">Untuk Pasien</option>
                  <option value="Caregiver">Untuk Caregiver</option>
                  <option value="Keduanya">Untuk Pasien dan Caregiver</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-base sm:text-lg font-semibold text-black">Pertanyaan</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => addQuestion('multiple_choice')}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  + Pilihan Ganda
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('multiple_selection')}
                  className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 transition-colors"
                >
                  + Multiple Selection
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('text_input')}
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  + Isian Teks
                </button>
              </div>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {questions.map((question, qIndex) => (
                <div key={question.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h3 className="font-medium text-sm sm:text-base text-black">Pertanyaan {qIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-800 text-xs sm:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 sm:mb-3 text-sm sm:text-base"
                    placeholder="Tulis pertanyaan di sini"
                    required
                  />
                  <div className="mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-black mb-1">Tipe Jawaban</label>
                    <select
                      value={question.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'multiple_choice' | 'multiple_selection' | 'text_input';
                        updateQuestionType(question.id, newType);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                    >
                      <option value="multiple_choice">Pilihan Ganda</option>
                      <option value="multiple_selection">Multiple Selection</option>
                      <option value="text_input">Isian Teks</option>
                    </select>
                  </div>
                  {(question.type === 'multiple_choice' || question.type === 'multiple_selection') ? (
                    <div className="space-y-2">
                      {question.options?.map((option, oIndex) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            placeholder={`Opsi ${oIndex + 1}`}
                          />
                          <input
                            type="number"
                            value={option.score}
                            onChange={(e) => updateOption(question.id, option.id, 'score', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-sm"
                            placeholder="Score"
                          />
                          <select
                            value={option.type}
                            onChange={(e) => updateOption(question.id, option.id, 'type', e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="fixed">Fixed</option>
                            <option value="custom">Custom</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, option.id)}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        + Tambah Opsi
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-black mb-1">Placeholder</label>
                      <input
                        type="text"
                        value={question.textPlaceholder || ''}
                        onChange={(e) => updateTextPlaceholder(question.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm sm:text-base"
                        placeholder="Masukkan placeholder untuk jawaban..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Result Tiers */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-base sm:text-lg font-semibold text-black">Definisi Hasil Skrining</h2>
              <button
                type="button"
                onClick={addResultTier}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors w-full sm:w-auto"
              >
                Tambah Tingkatan
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {resultTiers.map((tier, tIndex) => (
                <div key={tier.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h3 className="font-medium text-sm sm:text-base text-black">Tingkatan {tIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeResultTier(tier.id)}
                      className="text-red-600 hover:text-red-800 text-xs sm:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                        Skor Min
                      </label>
                      <input
                        type="number"
                        value={tier.minScore}
                        onChange={(e) => updateResultTier(tier.id, 'minScore', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                        required
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                        Skor Max
                      </label>
                      <input
                        type="number"
                        value={tier.maxScore}
                        onChange={(e) => updateResultTier(tier.id, 'maxScore', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                        required
                        min="0"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="mb-2 sm:mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                      Label Hasil
                    </label>
                    <input
                      type="text"
                      value={tier.label}
                      onChange={(e) => updateResultTier(tier.id, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                      placeholder="Contoh: Risiko Rendah"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-black mb-1">
                      Rekomendasi
                    </label>
                    <textarea
                      value={tier.recommendation}
                      onChange={(e) => updateResultTier(tier.id, 'recommendation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base"
                      rows={2}
                      placeholder="Tulis rekomendasi untuk hasil ini"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-4 py-2 text-black hover:text-black border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Kuesioner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
