// Simple test to check if the CalorieCalculation table has data
import { prisma } from '@/lib/db';

async function testCalorieCalculations() {
  try {
    const count = await prisma.calorieCalculation.count();
    console.log(`Number of calorie calculations in the database: ${count}`);
    
    if (count > 0) {
      const calculations = await prisma.calorieCalculation.findMany({
        include: {
          patient: true,
          caregiver: true,
        },
        take: 5, // Just get the first 5 records
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('Recent calculations:', JSON.stringify(calculations, null, 2));
    } else {
      console.log('No calculations found in the database');
    }
  } catch (error) {
    console.error('Error accessing database:', error);
  }
}

testCalorieCalculations();