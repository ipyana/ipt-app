-- CreateTable
CREATE TABLE "WindowConfig" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WindowConfig_pkey" PRIMARY KEY ("id")
);

-- Seed default windows (all closed by default)
INSERT INTO "WindowConfig" ("type", "enabled", "updated_at") VALUES
  ('application', false, now()),
  ('transfer', false, now()),
  ('reapplication', false, now());

-- CreateIndex
CREATE UNIQUE INDEX "WindowConfig_type_key" ON "WindowConfig"("type");

-- Performance indexes
CREATE INDEX "PhaseAllocation_cluster_id_phase_id_idx" ON "PhaseAllocation"("cluster_id", "phase_id");
CREATE INDEX "PhaseAllocation_application_id_idx" ON "PhaseAllocation"("application_id");
CREATE INDEX "EmailLog_status_created_at_idx" ON "EmailLog"("status", "created_at");
CREATE INDEX "Application_status_submission_date_idx" ON "Application"("status", "submission_date");
CREATE INDEX "TransferRequest_application_id_status_idx" ON "TransferRequest"("application_id", "status");
