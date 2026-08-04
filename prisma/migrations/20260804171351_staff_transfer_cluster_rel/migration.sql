-- AddForeignKey
ALTER TABLE "StaffTransferRequest" ADD CONSTRAINT "StaffTransferRequest_from_cluster_fkey" FOREIGN KEY ("from_cluster_id") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTransferRequest" ADD CONSTRAINT "StaffTransferRequest_to_cluster_fkey" FOREIGN KEY ("to_cluster_id") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
