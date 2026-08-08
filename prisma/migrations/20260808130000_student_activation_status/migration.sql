-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending_activation',
ADD COLUMN     "temporary_password_expires_at" TIMESTAMP(3);

-- Backfill: students who already completed the forced password change are active.
UPDATE "Student" SET "status" = 'active' WHERE "must_change_password" = false;
