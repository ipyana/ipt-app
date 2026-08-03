-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Otp_email_purpose_idx" ON "Otp"("email", "purpose");
