// Test script to verify the CalorieCalculation model exists and works
import { prisma } from '@/lib/db';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection by counting patients
    const patientCount = await prisma.patient.count();
    console.log(`Patient count: ${patientCount}`);
    
    // Test CalorieCalculation model
    const calorieCalculationCount = await prisma.calorieCalculation.count();
    console.log(`Calorie calculation count: ${calorieCalculationCount}`);
    
    // Try to create a test record (only if there are patients)
    if (patientCount > 0) {
      const firstPatient = await prisma.patient.findFirst();
      if (firstPatient) {
        console.log(`Found a test patient with ID: ${firstPatient.id}`);
        
        // Try to create a test calorie calculation
        const testCalculation = await prisma.calorieCalculation.create({
          data: {
            patientId: firstPatient.id,
            doctorId: firstPatient.doctorId,
            gender: 'Laki-laki',
            heightCm: 170,
            weightKg: 70,
            age: 30,
            activity: 'Ringan',
            result: {
              total: 2500,
              totalRounded: 2500,
              bbi: 70,
              kkb: 1750,
              factorAge: 50,
              factorActivity: 700,
              factorWeight: 0,
              bmi: 24.2
            }
          }
        });
        
        console.log('Successfully created test calorie calculation:', testCalculation.id);
        
        // Clean up - delete the test record
        await prisma.calorieCalculation.delete({
          where: { id: testCalculation.id }
        });
        
        console.log('Test calculation cleaned up');
      }
    }
    
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();