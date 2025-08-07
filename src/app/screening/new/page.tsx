'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface Questionnaire {
  id: string;
  title: string;
  questions: {
    text: string;
    options: {
      text: string;
      score: number;
    }[];
  }[];
  resultTiers: {
    minScore: number;
    maxScore: number;
    label: string;
    recommendation: string;
  }[];
}

interface Patient {
  id: string;
  name: string;
  age: number;
}

function NewScreeningContent() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionIndex: number; optionIndex: number; score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }

    const patientId = searchParams.get('patientId');
    fetchData(patientId);
  }, [router, searchParams]);

  const fetchData = async (patientId?: string | null) => {
    try {
      const token = getAuthToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [questionnairesRes, patientsRes] = await Promise.all([
        fetch('/api/questionnaires', { headers }),
        fetch('/api/patients', { headers })
      ]);

      if (questionnairesRes.ok && patientsRes.ok) {
        const questionnairesData = await questionnairesRes.json();
        const patientsData = await patientsRes.json();
        
        setQuestionnaires(questionnairesData);
        setPatients(patientsData);

        if (patientId) {
          const patient = patientsData.find((p: Patient) => p.id === patientId);
          if (patient) setSelectedPatient(patient);
        }
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, optionIndex: number, score: number) => {
    const newAnswers = [...answers];
    const existingAnswerIndex = newAnswers.findIndex(a => a.questionIndex === questionIndex);
    
    if (existingAnswerIndex >= 0) {
      newAnswers[existingAnswerIndex] = { questionIndex, optionIndex, score };
    } else {
      newAnswers.push({ questionIndex, optionIndex, score });
    }
    
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < (selectedQuestionnaire?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuestionnaire || !selectedPatient || !answers.find(a => a.questionIndex === currentQuestionIndex)) {
      alert('Harap jawab pertanyaan terlebih dahulu');
      return;
    }

    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const resultTier = selectedQuestionnaire.resultTiers.find(
      tier => totalScore >= tier.minScore && totalScore <= tier.maxScore
    );

    if (!resultTier) {
      alert('Tidak ada tingkatan hasil yang sesuai');
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch('/api/screening-results', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          templateId: selectedQuestionnaire.id,
          answers: answers.map(a => ({
            questionIndex: a.questionIndex,
            optionIndex: a.optionIndex,
            score: a.score
          })),
          totalScore,
          resultLabel: resultTier.label,
          recommendation: resultTier.recommendation
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/screening/result/${result.id}`);
      } else {
        alert('Gagal menyimpan hasil skrining');
      }
    } catch (error) {
      console.error('Error submitting screening:', error);
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

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <h1 className="text-lg sm:text-xl font-semibold text-black">Mulai Skrining Baru</h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-black hover:text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-black">Pilih Kuesioner dan Pasien</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                  Pilih Kuesioner
                </label>
                <select
                  onChange={(e) => {
                    const questionnaire = questionnaires.find(q => q.id === e.target.value);
                    setSelectedQuestionnaire(questionnaire || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Pilih kuesioner...</option>
                  {questionnaires.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                  Pilih Pasien
                </label>
                <select
                  onChange={(e) => {
                    const patient = patients.find(p => p.id === e.target.value);
                    setSelectedPatient(patient || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Pilih pasien...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.age} tahun</option>
                  ))}
                </select>
              </div>

              {/* Tombol Konfirmasi/Mulai */}
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    if (selectedQuestionnaire && selectedPatient) {
                      setHasStarted(true);
                    }
                  }}
                  disabled={!selectedQuestionnaire || !selectedPatient}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                >
                  {selectedQuestionnaire && selectedPatient 
                    ? `Mulai Skrining - ${selectedQuestionnaire.title} untuk ${selectedPatient.name}`
                    : 'Pilih kuesioner dan pasien terlebih dahulu'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasStarted || !selectedQuestionnaire) {
    return null;
  }

  const question = selectedQuestionnaire?.questions[currentQuestionIndex];
  const progress = selectedQuestionnaire ? ((currentQuestionIndex + 1) / selectedQuestionnaire.questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-black">{selectedQuestionnaire?.title}</h1>
              <p className="text-xs sm:text-sm text-black">{selectedPatient?.name} ({selectedPatient?.age} tahun)</p>
            </div>
            <button
              onClick={() => {
                setHasStarted(false);
                setCurrentQuestionIndex(0);
                setAnswers([]);
              }}
              className="text-black hover:text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between text-xs sm:text-sm text-black mb-1 sm:mb-2">
            <span>Pertanyaan {currentQuestionIndex + 1} dari {selectedQuestionnaire?.questions?.length || 0}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div 
              className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-black">{question?.text}</h2>
          
          <div className="space-y-2 sm:space-y-3">
            {question?.options?.map((option, index) => (
              <label key={index} className="flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  checked={answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndex === index}
                  onChange={() => handleAnswer(currentQuestionIndex, index, option.score)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-black text-sm sm:text-base">{option.text}</span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-4 sm:mt-6 pt-3 sm:pt-4 border-t space-y-2 sm:space-y-0">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="w-full sm:w-auto px-4 py-2 text-black hover:text-black border border-gray-300 rounded-md disabled:opacity-50 transition-colors"
            >
              Sebelumnya
            </button>
            
            {currentQuestionIndex === (selectedQuestionnaire?.questions?.length || 0) - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!answers.find(a => a.questionIndex === currentQuestionIndex)}
                className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Selesai
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers.find(a => a.questionIndex === currentQuestionIndex)}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Selanjutnya
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewScreening() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-black">Loading...</p>
      </div>
    </div>}>
      <NewScreeningContent />
    </Suspense>
  );
}
