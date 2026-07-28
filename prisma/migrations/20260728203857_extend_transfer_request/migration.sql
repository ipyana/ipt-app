-- AlterTable
ALTER TABLE "TransferRequest" ADD COLUMN     "pref1_new" INTEGER,
ADD COLUMN     "pref2_new" INTEGER,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'transfer',
ALTER COLUMN "to_cluster_id" DROP NOT NULL;
