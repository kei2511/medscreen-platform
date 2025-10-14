export type Gender = 'Laki-laki' | 'Perempuan';
export type ActivityLevel = 'Istirahat' | 'Ringan' | 'Sedang' | 'Berat';

export interface CalorieInput {
  gender: Gender;
  heightCm: number; // cm
  weightKg: number; // kg
  age: number; // years
  activity: ActivityLevel;
}

export interface CalorieResult {
  bbi: number;
  kkb: number;
  factorAge: number;
  factorActivity: number;
  factorWeight: number;
  total: number; // unrounded total (float)
  totalRounded: number; // Math.round(total)
  bmi: number;
}

export function computeCalories(input: CalorieInput): CalorieResult {
  const { gender, heightCm, weightKg, age, activity } = input;

  // Basic validation (caller should validate more thoroughly)
  if (!heightCm || !weightKg || !age) {
    throw new Error('heightCm, weightKg and age must be provided and non-zero');
  }

  // Step 1: BBI
  let multiplier = 1;
  if (gender === 'Laki-laki') {
    multiplier = heightCm > 160 ? 0.9 : 1;
  } else {
    // Perempuan
    multiplier = heightCm >= 150 ? 0.9 : 1; // note: >=150 uses 0.9 per spec
  }

  const bbi = (heightCm - 100) * multiplier;

  // Step 2: KKB
  const kkb = gender === 'Perempuan' ? bbi * 25 : bbi * 30;

  // Step 3: Faktor Koreksi Usia
  let factorAge = 0;
  if (age >= 40 && age <= 59) {
    factorAge = -0.05 * kkb;
  } else if (age >= 60 && age <= 69) {
    factorAge = -0.10 * kkb;
  } else if (age > 70) {
    factorAge = -0.20 * kkb;
  }

  // Step 4: Faktor Koreksi Aktivitas
  const activityMap: Record<ActivityLevel, number> = {
    Istirahat: 0.10,
    Ringan: 0.20,
    Sedang: 0.30,
    Berat: 0.50,
  };
  const activityFactor = activityMap[activity] ?? 0;
  const factorActivity = activityFactor * kkb;

  // Step 5: Faktor Koreksi Berat Badan (IMT)
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let factorWeight = 0;
  if (bmi < 18.5) {
    factorWeight = 0.20 * kkb;
  } else if (bmi > 25) {
    factorWeight = -0.20 * kkb;
  } else {
    factorWeight = 0;
  }

  // Step 6: Total
  const total = kkb + factorAge + factorActivity + factorWeight;
  const totalRounded = Math.round(total);

  // Return values with reasonable precision for display
  return {
    bbi: Math.round(bbi * 100) / 100,
    kkb: Math.round(kkb * 100) / 100,
    factorAge: Math.round(factorAge * 100) / 100,
    factorActivity: Math.round(factorActivity * 100) / 100,
    factorWeight: Math.round(factorWeight * 100) / 100,
    total: Math.round(total * 100) / 100,
    totalRounded,
    bmi: Math.round(bmi * 100) / 100,
  };
}
