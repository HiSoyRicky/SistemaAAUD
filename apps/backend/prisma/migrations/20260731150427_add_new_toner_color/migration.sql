-- AlterEnum
ALTER TYPE "TonerColor" ADD VALUE 'TRI_COLOR';

-- AlterTable
ALTER TABLE "inventory_transfer_requests" ALTER COLUMN "review_notes" SET DATA TYPE TEXT;
