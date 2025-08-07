/*
  Warnings:

  - You are about to drop the column `video` on the `ScreeningResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "videoFile" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "videoType" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "videoUrl" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScreeningResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalScore" INTEGER NOT NULL,
    "resultLabel" TEXT NOT NULL,
    "recommendation" TEXT,
    "videoType" TEXT,
    "videoUrl" TEXT,
    "videoFile" TEXT,
    "answers" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScreeningResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScreeningResult_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScreeningResult_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestionnaireTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ScreeningResult" ("answers", "createdAt", "date", "doctorId", "id", "patientId", "recommendation", "resultLabel", "templateId", "totalScore", "updatedAt") SELECT "answers", "createdAt", "date", "doctorId", "id", "patientId", "recommendation", "resultLabel", "templateId", "totalScore", "updatedAt" FROM "ScreeningResult";
DROP TABLE "ScreeningResult";
ALTER TABLE "new_ScreeningResult" RENAME TO "ScreeningResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
