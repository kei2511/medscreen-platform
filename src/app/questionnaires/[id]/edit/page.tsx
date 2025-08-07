'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface Question {
  text: string;
  options: {
    text: string;
    score: number;
  }[];
}

interface ResultTier {
  minScore: number;
  maxScore: number;
  label: string;
  recommendation: string;
}

interface Questionnaire {
  id: string;
  title: string;
  questions: Question[];
  resultTiers: ResultTier[];
}

export default function EditQuestionnaire() {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultTiers, setResultTiers] = useState<ResultTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const questionnaireId = params.id as string;

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    fetchQuestionnaire();
  }, [router, questionnaireId]);

  const fetchQuestionnaire = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/questionnaires/${questionnaireId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuestionnaire(data);
        setTitle(data.title);
        setQuestions(data.questions);
        setResultTiers(data.resultTiers);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', options: [{ text: '', score: 0 }, { text: '', score: 0 }] }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ text: '', score: 0 });
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: string, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: field === 'score' ? Number(value) : value
    };
    setQuestions(newQuestions);
  };

  const handleAddTier = () => {
    setResultTiers([...resultTiers, { minScore: 0, maxScore: 0, label: '', recommendation: '' }]);
  };

  const handleRemoveTier = (index: number) => {
    setResultTiers(resultTiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: string, value: string | number) => {
    const newTiers = [...resultTiers];
    newTiers[index] = { ...newTiers[index], [field]: field.includes('Score') ? Number(value) : value };
    setResultTiers(newTiers);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Judul kuesioner tidak boleh kosong');
      return;
    }

    if (questions.length === 0) {
      alert('Minimal harus ada 1 pertanyaan');
      return;
    }

    if (resultTiers.length === 0) {
      alert('Minimal harus ada 1 tingkatan hasil');
      return;
    }

    setIsSaving(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/questionnaires/${questionnaireId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          questions,
          resultTiers,
        }),
      });

      if (response.ok) {
        alert('Kuesioner berhasil diperbarui!');
        router.push('/dashboard');
      } else {
        alert('Gagal memperbarui kuesioner');
      }
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      alert('Terjadi kesalahan saat menyimpan');
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

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-black text-center">Kuesioner tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-black">Edit Kuesioner</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-black hover:text-black"
            >
              Kembali
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Edit Kuesioner</h2>
          
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Judul Kuesioner
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan judul kuesioner..."
              />
            </div>

            {/* Questions */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold text-black">Pertanyaan</h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Tambah Pertanyaan
                </button>
              </div>

              {questions.map((question, qIndex) => (
                <div key={qIndex} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-black">Pertanyaan {qIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Hapus
                    </button>
                  </div>

                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                    placeholder="Teks pertanyaan..."
                  />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-black">Jawaban:</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIndex)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Tambah Jawaban
                      </button>
                    </div>

                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Teks jawaban..."
                        />
                        <input
                          type="number"
                          value={option.score}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, 'score', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Skor"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Result Tiers */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold text-black">Tingkatan Hasil</h3>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Tambah Tingkatan
                </button>
              </div>

              {resultTiers.map((tier, tIndex) => (
                <div key={tIndex} className="border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-black">Tingkatan {tIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(tIndex)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <input
                      type="number"
                      value={tier.minScore}
                      onChange={(e) => handleTierChange(tIndex, 'minScore', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Skor Min"
                      min="0"
                    />
                    <input
                      type="number"
                      value={tier.maxScore}
                      onChange={(e) => handleTierChange(tIndex, 'maxScore', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Skor Max"
                      min="0"
                    />
                  </div>
                  <input
                    type="text"
                    value={tier.label}
                    onChange={(e) => handleTierChange(tIndex, 'label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                    placeholder="Label hasil..."
                  />
                  <textarea
                    value={tier.recommendation}
                    onChange={(e) => handleTierChange(tIndex, 'recommendation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Rekomendasi..."
                    rows={2}
                  />
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
