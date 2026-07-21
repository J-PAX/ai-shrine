-- AlterTable
ALTER TABLE "RitualEvent"
ADD COLUMN "incenseName" TEXT,
ADD COLUMN "dailyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RitualEvent_daily_once_key"
ON "RitualEvent"("sessionId", "eventType", "dailyKey")
WHERE "dailyKey" IS NOT NULL;
