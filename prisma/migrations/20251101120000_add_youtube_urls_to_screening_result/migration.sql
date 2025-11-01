-- Add youtubeUrls column to ScreeningResult table
ALTER TABLE "ScreeningResult" ADD COLUMN "youtubeUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];