-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DOCTOR', 'RESPONDENT');

-- CreateEnum
CREATE TYPE "HubunganDenganPasien" AS ENUM ('Anak', 'OrangTua', 'SaudaraKandung', 'Lainnya');

-- CreateEnum
CREATE TYPE "JenisKuesioner" AS ENUM ('Pasien', 'Caregiver', 'Keduanya');

-- DropForeignKey
ALTER TABLE "ScreeningResult" DROP CONSTRAINT "ScreeningResult_patientId_fkey";

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "caregiverId" TEXT,
ADD COLUMN     "jenis_kelamin" INTEGER,
ADD COLUMN     "lama_menderita_dm" DOUBLE PRECISION,
ADD COLUMN     "penyakit_lain" TEXT,
ADD COLUMN     "umur_pasien" INTEGER;

-- AlterTable
ALTER TABLE "QuestionnaireTemplate" ADD COLUMN     "jenis_kuesioner" "JenisKuesioner" NOT NULL DEFAULT 'Pasien';

-- AlterTable
ALTER TABLE "ScreeningResult" ADD COLUMN     "caregiverId" TEXT,
ALTER COLUMN "patientId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL,
    "nama_keluarga" TEXT NOT NULL,
    "jenis_kelamin" INTEGER NOT NULL,
    "umur_keluarga" INTEGER NOT NULL,
    "hubungan_dengan_pasien" "HubunganDenganPasien" NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caregiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respondent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "patientName" TEXT NOT NULL,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "caregiverName" TEXT,
    "caregiverRelation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Respondent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespondentSubmission" (
    "id" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fillAs" "JenisKuesioner" NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "resultLabel" TEXT,
    "recommendation" TEXT,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespondentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Respondent_email_key" ON "Respondent"("email");

-- AddForeignKey
ALTER TABLE "Caregiver" ADD CONSTRAINT "Caregiver_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningResult" ADD CONSTRAINT "ScreeningResult_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentSubmission" ADD CONSTRAINT "RespondentSubmission_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentSubmission" ADD CONSTRAINT "RespondentSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestionnaireTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
