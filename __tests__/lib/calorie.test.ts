import { computeCalories } from '../../src/lib/calorie';

describe('computeCalories', () => {
  it('matches example case from spec (female, 150cm, 60kg, 45yo, Sedang)', () => {
    const result = computeCalories({
      gender: 'Perempuan',
      heightCm: 150,
      weightKg: 60,
      age: 45,
      activity: 'Sedang'
    });

    // Expect values according to spec
    expect(result.bbi).toBeCloseTo(45, 2);
    expect(result.kkb).toBeCloseTo(1125, 2);
    expect(result.factorAge).toBeCloseTo(-56.25, 2);
    expect(result.factorActivity).toBeCloseTo(337.5, 2);
    expect(result.factorWeight).toBeCloseTo(-225, 2);
    expect(result.totalRounded).toBe(1181);
  });

  it('handles male TB boundary at 160cm', () => {
    const r = computeCalories({ gender: 'Laki-laki', heightCm: 160, weightKg: 70, age: 30, activity: 'Ringan' });
    // TB <= 160 uses multiplier 1
    expect(r.bbi).toBeCloseTo((160 - 100) * 1, 2);
  });

  it('handles female TB boundary at 150cm', () => {
    const r = computeCalories({ gender: 'Perempuan', heightCm: 150, weightKg: 55, age: 25, activity: 'Istirahat' });
    // Perempuan TB >= 150 uses multiplier 0.9
    expect(r.bbi).toBeCloseTo((150 - 100) * 0.9, 2);
  });

  it('throws on invalid input', () => {
    expect(() => computeCalories({ gender: 'Perempuan', heightCm: 0, weightKg: 0, age: 0, activity: 'Istirahat' })).toThrow();
  });
});
