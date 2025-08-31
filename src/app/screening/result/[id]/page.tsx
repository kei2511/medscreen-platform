'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';

interface ScreeningResult {
  id: string;
  totalScore: number;
  resultLabel: string;
  recommendation?: string;
  date: string;
  patient?: {
    id: string;
    name: string;
    age: number;
  };
  caregiver?: {
    id: string;
    nama_keluarga: string;
    jenis_kelamin: number;
    umur_keluarga: number;
    hubungan_dengan_pasien: string;
  };
  template: {
    title: string;
    questions: {
      text: string;
      type: 'multiple_choice' | 'multiple_selection' | 'text_input';
      options?: {
        text: string;
        score: number;
        type: 'fixed' | 'custom';
      }[];
    }[];
  };
  answers: {
    questionIndex: number;
    optionIndex?: number;
    optionIndices?: number[];
    score?: number;
    scores?: number[];
    textAnswer?: string;
    customAnswers?: { [optionIndex: number]: string };
  }[];
}

export default function ScreeningResultPage() {
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/');
      return;
    }
    fetchResult();
  }, [router, resultId]);

  const fetchResult = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/screening-results/${resultId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
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

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-black text-center">Hasil tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <h1 className="text-lg sm:text-xl font-semibold text-black">Hasil Skrining</h1>
            <button
              onClick={handleBackToDashboard}
              className="text-black hover:text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">{result.template.title}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-black">
              <span>
                {result.patient 
                  ? `${result.patient.name} (${result.patient.age} tahun)`
                  : result.caregiver 
                    ? `${result.caregiver.nama_keluarga} - ${result.caregiver.hubungan_dengan_pasien} (${result.caregiver.umur_keluarga} tahun)`
                    : 'Responden tidak diketahui'
                }
              </span>
              <span>•</span>
              <span>{new Date(result.date).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          {/* Score */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block bg-green-100 rounded-full px-6 sm:px-8 py-3 sm:py-4">
              <div className="text-2xl sm:text-3xl font-bold text-green-800">{result.totalScore}</div>
              <div className="text-xs sm:text-sm text-green-600">Total Skor</div>
            </div>
          </div>

          {/* Result */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">Hasil Skrining</h3>
            <p className="text-yellow-700 text-base sm:text-lg font-medium">{result.resultLabel}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">Rekomendasi</h3>
            <p className="text-black text-sm sm:text-base">
              {result.recommendation ? (
                <span>{result.recommendation}</span>
              ) : (
                <span>
                  Berdasarkan hasil skrining, pasien dikategorikan sebagai <strong>{result.resultLabel}</strong>.
                  Disarankan untuk melakukan tindak lanjut sesuai dengan protokol klinik Anda.
                </span>
              )}
            </p>
          </div>

          {/* Video Anjuran Penanganan */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Anjuran Penanganan</h3>
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              <video
                controls
                className="w-full h-full"
                poster="/images/video-poster.jpg"
                preload="metadata"
              >
                <source src="/videos/Video Test.mp4" type="video/mp4" />
                <p className="text-black p-4 text-center">
                  Browser Anda tidak mendukung pemutaran video. Silakan unduh video untuk menonton.
                </p>
              </video>
            </div>
            <p className="text-sm text-black mt-3">
              Tonton video ini untuk mendapatkan panduan lengkap mengenai anjuran penanganan sesuai dengan hasil skrining pasien.
              Video ini berisi langkah-langkah yang direkomendasikan untuk tindak lanjut pasca-skrining.
            </p>
          </div>

          {/* Detailed Answers */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">Jawaban yang Dipilih</h3>
            <div className="space-y-3">
              {result.template.questions.map((question, index) => {
                const answer = result.answers.find(a => a.questionIndex === index);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-black mb-2">
                      {index + 1}. {question.text}
                    </h4>
                    <div className="text-sm text-gray-700">
                      {question.type === 'text_input' ? (
                        <p><strong>Jawaban:</strong> {answer?.textAnswer || 'Tidak dijawab'}</p>
                      ) : question.type === 'multiple_choice' ? (
                        <div>
                          <p><strong>Jawaban:</strong> {answer?.optionIndex !== undefined ? 
                            question.options?.[answer.optionIndex]?.text || 'Tidak dijawab' : 'Tidak dijawab'}</p>
                          {answer?.optionIndex !== undefined && 
                           question.options?.[answer.optionIndex]?.type === 'custom' &&
                           answer?.textAnswer && (
                            <p className="mt-1"><strong>Detail:</strong> {answer.textAnswer}</p>
                          )}
                        </div>
                      ) : question.type === 'multiple_selection' ? (
                        <div>
                          <strong>Jawaban:</strong>
                          {answer?.optionIndices && answer.optionIndices.length > 0 ? (
                            <ul className="list-disc list-inside mt-1">
                              {answer.optionIndices.map((optIndex, i) => (
                                <li key={i}>
                                  {question.options?.[optIndex]?.text || 'Pilihan tidak valid'}
                                  {question.options?.[optIndex]?.type === 'custom' &&
                                   answer?.customAnswers?.[optIndex] && (
                                    <span className="ml-1">({answer.customAnswers[optIndex]})</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span> Tidak dijawab</span>
                          )}
                        </div>
                      ) : (
                        <p><strong>Jawaban:</strong> Tidak diketahui</p>
                      )}
                      {answer?.score !== undefined && (
                        <p className="mt-1"><strong>Skor:</strong> {answer.score}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleBackToDashboard}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
            <button
              onClick={() => router.push(`/screening/new?patientId=${result.patient.id}`)}
              className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Skrining Baru
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
