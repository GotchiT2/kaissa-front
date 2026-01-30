-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP(3);
