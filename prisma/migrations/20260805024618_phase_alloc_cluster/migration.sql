-- AddForeignKey
ALTER TABLE "PhaseAllocation" ADD CONSTRAINT "PhaseAllocation_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "Cluster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
