'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  jenis_kuesioner?: 'Pasien' | 'Caregiver' | 'Keduanya';
  questions: {
    text: string;
    type: 'multiple_choice' | 'multiple_selection' | 'text_input';
    options?: {
      text: string;
      score: number;
      type: 'fixed' | 'custom';
    }[];
    textPlaceholder?: string;
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

interface Caregiver {
  id: string;
  nama_keluarga: string;
  jenis_kelamin: number;
  umur_keluarga: number;
  hubungan_dengan_pasien: string;
}

interface Answer {
  questionIndex: number;
  optionIndex?: number;
  optionIndices?: number[];
  score?: number;
  scores?: number[];
  textAnswer?: string;
  customAnswers?: { [optionIndex: number]: string };
}

function NewScreeningContent() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [selectedRespondent, setSelectedRespondent] = useState<'patient' | 'caregiver' | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
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

      const [questionnairesRes, patientsRes, caregiversRes] = await Promise.all([
        fetch('/api/questionnaires', { headers }),
        fetch('/api/patients', { headers }),
        fetch('/api/caregivers', { headers })
      ]);

      if (questionnairesRes.ok && patientsRes.ok && caregiversRes.ok) {
        const questionnairesData = await questionnairesRes.json();
        const patientsData = await patientsRes.json();
        const caregiversData = await caregiversRes.json();
        
        // Normalisasi data untuk backward compatibility
        const normalizedQuestionnaires = questionnairesData.map((q: any) => ({
          ...q,
          questions: (q.questions || []).map((question: any) => ({
            text: question.text || '',
            type: question.type || 'multiple_choice',
            options: question.options ? question.options.map((opt: any) => ({
              text: opt.text || '',
              score: Number(opt.score) || 0,
              type: opt.type || 'fixed'
            })) : [],
            textPlaceholder: question.textPlaceholder || 'Masukkan jawaban...'
          }))
        }));
        
        setQuestionnaires(normalizedQuestionnaires);
        setPatients(patientsData);
        setCaregivers(caregiversData);

        if (patientId) {
          const patient = patientsData.find((p: Patient) => p.id === patientId);
          if (patient) {
            setSelectedPatient(patient);
            setSelectedRespondent('patient');
          }
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

  const handleAnswer = (questionIndex: number, optionIndex?: number, score?: number, textAnswer?: string, isMultipleSelection = false, customAnswers?: { [optionIndex: number]: string }) => {
    const newAnswers = [...answers];
    const existingAnswerIndex = newAnswers.findIndex(a => a.questionIndex === questionIndex);
    
    if (isMultipleSelection) {
      // Handle multiple selection
      const existingAnswer = newAnswers[existingAnswerIndex];
      let optionIndices = existingAnswer?.optionIndices || [];
      let scores = existingAnswer?.scores || [];
      
      if (optionIndex !== undefined && score !== undefined) {
        const index = optionIndices.indexOf(optionIndex);
        if (index > -1) {
          optionIndices.splice(index, 1);
          scores.splice(index, 1);
        } else {
          optionIndices.push(optionIndex);
          scores.push(score);
        }
      }
      
      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      
      const existingCustomAnswers = existingAnswerIndex >= 0 ? newAnswers[existingAnswerIndex].customAnswers : {};
      const finalCustomAnswers = { ...existingCustomAnswers, ...customAnswers };
      
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = { questionIndex, optionIndices, scores, score: totalScore, customAnswers: finalCustomAnswers };
      } else {
        newAnswers.push({ questionIndex, optionIndices, scores, score: totalScore, customAnswers: finalCustomAnswers });
      }
    } else {
      // Handle single selection (existing logic)
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = { questionIndex, optionIndex, score, textAnswer };
      } else {
        newAnswers.push({ questionIndex, optionIndex, score, textAnswer });
      }
    }
    
    setAnswers(newAnswers);
  };

  const handleCustomAnswer = (questionIndex: number, optionIndex: number, score: number, textAnswer: string, isMultipleSelection = false) => {
    const newAnswers = [...answers];
    const existingAnswerIndex = newAnswers.findIndex(a => a.questionIndex === questionIndex);
    
    if (isMultipleSelection) {
      const existingAnswer = newAnswers[existingAnswerIndex];
      const customAnswers = existingAnswer?.customAnswers || {};
      customAnswers[optionIndex] = textAnswer;
      
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = { ...newAnswers[existingAnswerIndex], customAnswers };
      } else {
        newAnswers.push({ questionIndex, customAnswers });
      }
    } else {
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = { questionIndex, optionIndex, score, textAnswer };
      } else {
        newAnswers.push({ questionIndex, optionIndex, score, textAnswer });
      }
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

  // Fungsi untuk memfilter kuesioner berdasarkan responden
  const getFilteredQuestionnaires = () => {
    if (!selectedRespondent) return questionnaires;
    
    return questionnaires.filter(q => {
      const jenis = q.jenis_kuesioner || 'Pasien';
      if (selectedRespondent === 'patient') {
        return jenis === 'Pasien' || jenis === 'Keduanya';
      } else if (selectedRespondent === 'caregiver') {
        return jenis === 'Caregiver' || jenis === 'Keduanya';
      }
      return true;
    });
  };

  // Fungsi untuk memfilter responden berdasarkan kuesioner
  const getFilteredRespondents = () => {
    if (!selectedQuestionnaire) return { patients: [], caregivers: [] };
    
    const jenis = selectedQuestionnaire.jenis_kuesioner || 'Pasien';
    if (jenis === 'Pasien') {
      return { patients, caregivers: [] };
    } else if (jenis === 'Caregiver') {
      return { patients: [], caregivers };
    } else {
      return { patients, caregivers };
    }
  };

  const handleSubmit = async () => {
    console.log('Submitting screening:', { selectedQuestionnaire, selectedPatient, selectedCaregiver, answers });
    
    if (!selectedQuestionnaire || (!selectedPatient && !selectedCaregiver)) {
      alert('Data tidak lengkap');
      return;
    }
    
    if (answers.length !== selectedQuestionnaire.questions.length) {
      alert(`Harap jawab semua ${selectedQuestionnaire.questions.length} pertanyaan terlebih dahulu. Anda baru menjawab ${answers.length}.`);
      return;
    }

    const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
    console.log('Total score:', totalScore);
    console.log('Result tiers:', selectedQuestionnaire.resultTiers);
    
    const resultTier = selectedQuestionnaire.resultTiers.find(
      tier => totalScore >= tier.minScore && totalScore <= tier.maxScore
    );

    if (!resultTier) {
      alert(`Tidak ada tingkatan hasil yang sesuai untuk skor ${totalScore}. Pastikan tier sudah benar.`);
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
          patientId: selectedPatient?.id || null,
          caregiverId: selectedCaregiver?.id || null,
          templateId: selectedQuestionnaire.id,
          answers: answers.map(a => ({
            questionIndex: a.questionIndex,
            optionIndex: a.optionIndex,
            optionIndices: a.optionIndices,
            scores: a.scores,
            score: a.score,
            textAnswer: a.textAnswer,
            customAnswers: a.customAnswers
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
              {/* Pilih Responden Terlebih Dahulu */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                  Pilih Responden *
                </label>
                <select
                  value={selectedRespondent || ''}
                  onChange={(e) => {
                    const respondent = e.target.value as 'patient' | 'caregiver' | '';
                    setSelectedRespondent(respondent || null);
                    setSelectedPatient(null);
                    setSelectedCaregiver(null);
                    setSelectedQuestionnaire(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Pilih responden...</option>
                  <option value="patient">Pasien</option>
                  <option value="caregiver">Caregiver</option>
                </select>
              </div>

              {/* Pilih Kuesioner */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                  Pilih Kuesioner *
                </label>
                <select
                  value={selectedQuestionnaire?.id || ''}
                  onChange={(e) => {
                    const questionnaire = questionnaires.find(q => q.id === e.target.value);
                    setSelectedQuestionnaire(questionnaire || null);
                    // Reset responden jika kuesioner berubah
                    setSelectedPatient(null);
                    setSelectedCaregiver(null);
                    setSelectedRespondent(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">Pilih kuesioner...</option>
                  {getFilteredQuestionnaires().map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.jenis_kuesioner || 'Pasien'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilih Pasien (jika responden = patient atau kuesioner = Pasien/Keduanya) */}
              {(selectedRespondent === 'patient' || (selectedQuestionnaire && (selectedQuestionnaire.jenis_kuesioner === 'Pasien' || selectedQuestionnaire.jenis_kuesioner === 'Keduanya'))) && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                    Pilih Pasien *
                  </label>
                  <select
                    value={selectedPatient?.id || ''}
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
              )}

              {/* Pilih Caregiver (jika responden = caregiver atau kuesioner = Caregiver/Keduanya) */}
              {(selectedRespondent === 'caregiver' || (selectedQuestionnaire && (selectedQuestionnaire.jenis_kuesioner === 'Caregiver' || selectedQuestionnaire.jenis_kuesioner === 'Keduanya'))) && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                    Pilih Caregiver *
                  </label>
                  <select
                    value={selectedCaregiver?.id || ''}
                    onChange={(e) => {
                      const caregiver = caregivers.find(c => c.id === e.target.value);
                      setSelectedCaregiver(caregiver || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">Pilih caregiver...</option>
                    {caregivers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nama_keluarga} - {c.hubungan_dengan_pasien} ({c.umur_keluarga} tahun)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tombol Konfirmasi/Mulai */}
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    if (selectedQuestionnaire && (selectedPatient || selectedCaregiver)) {
                      setHasStarted(true);
                    }
                  }}
                  disabled={!selectedQuestionnaire || (!selectedPatient && !selectedCaregiver)}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
                >
                  {selectedQuestionnaire && (selectedPatient || selectedCaregiver)
                    ? `Mulai Skrining - ${selectedQuestionnaire.title} untuk ${selectedPatient?.name || selectedCaregiver?.nama_keluarga}`
                    : 'Pilih kuesioner dan responden terlebih dahulu'
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
              <p className="text-xs sm:text-sm text-black">
                {selectedPatient 
                  ? `${selectedPatient.name} (${selectedPatient.age} tahun)`
                  : selectedCaregiver 
                    ? `${selectedCaregiver.nama_keluarga} - ${selectedCaregiver.hubungan_dengan_pasien} (${selectedCaregiver.umur_keluarga} tahun)`
                    : ''
                }
              </p>
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
          
          {(question?.type === 'multiple_choice' || question?.type === 'multiple_selection') && (
            <div className="space-y-2 sm:space-y-3">
              {question?.options?.map((option, index) => (
                <div key={index} className="space-y-2">
                  {option.type === 'fixed' ? (
                    <label className="flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type={question?.type === 'multiple_selection' ? 'checkbox' : 'radio'}
                        name={question?.type === 'multiple_selection' ? undefined : `question-${currentQuestionIndex}`}
                        checked={question?.type === 'multiple_selection' 
                          ? (answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndices || []).includes(index)
                          : answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndex === index}
                        onChange={() => handleAnswer(currentQuestionIndex, index, option.score, undefined, question?.type === 'multiple_selection')}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="text-black">{option.text}</span>
                    </label>
                  ) : (
                    <div className="p-3 sm:p-4 border rounded-lg">
                      <label className="flex items-center mb-2">
                        <input
                          type={question?.type === 'multiple_selection' ? 'checkbox' : 'radio'}
                          name={question?.type === 'multiple_selection' ? undefined : `question-${currentQuestionIndex}`}
                          checked={question?.type === 'multiple_selection' 
                            ? (answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndices || []).includes(index)
                            : answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndex === index}
                          onChange={() => handleAnswer(currentQuestionIndex, index, option.score, undefined, question?.type === 'multiple_selection')}
                          className="mr-3 h-4 w-4 text-blue-600"
                        />
                        <span className="text-black">{option.text}</span>
                      </label>
                      {option.type === 'custom' && (
                        question?.type === 'multiple_selection' 
                          ? (answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndices || []).includes(index)
                          : answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndex === index
                      ) && (
                        <input
                          type="text"
                          placeholder="Masukkan jawaban Anda"
                          value={question?.type === 'multiple_selection' 
                            ? (answers.find(a => a.questionIndex === currentQuestionIndex)?.customAnswers?.[index] || '')
                            : (answers.find(a => a.questionIndex === currentQuestionIndex)?.optionIndex === index 
                                ? (answers.find(a => a.questionIndex === currentQuestionIndex)?.textAnswer || '')
                                : '')
                          }
                          onChange={(e) => {
                            if (question?.type === 'multiple_selection') {
                              handleCustomAnswer(currentQuestionIndex, index, option.score, e.target.value, true);
                            } else {
                              handleCustomAnswer(currentQuestionIndex, index, option.score, e.target.value, false);
                            }
                          }}
                          className="w-full mt-2 p-2 border rounded-md text-black"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {question?.type === 'text_input' && (
            <div className="space-y-3">
              <textarea
                placeholder={question?.textPlaceholder || 'Masukkan jawaban...'}
                value={answers.find(a => a.questionIndex === currentQuestionIndex)?.textAnswer || ''}
                onChange={(e) => handleAnswer(currentQuestionIndex, undefined, undefined, e.target.value)}
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          )}

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
