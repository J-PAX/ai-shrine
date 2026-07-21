-- CreateTable
CREATE TABLE "RitualEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "godName" TEXT,
    "userMessage" TEXT,
    "resultText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RitualEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RitualEvent_sessionId_eventType_createdAt_idx"
ON "RitualEvent"("sessionId", "eventType", "createdAt");
