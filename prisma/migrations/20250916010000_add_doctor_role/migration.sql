-- CreateEnum Role if not exists (Postgres does not support IF NOT EXISTS for enum directly)
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add column role to Doctor if missing
ALTER TABLE "Doctor"
    ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER';
