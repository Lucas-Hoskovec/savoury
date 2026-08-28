-- AlterTable
ALTER TABLE "Report" ADD COLUMN "assignedToId" TEXT;

-- CreateIndex
CREATE INDEX "Report_assignedToId_idx" ON "Report"("assignedToId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
