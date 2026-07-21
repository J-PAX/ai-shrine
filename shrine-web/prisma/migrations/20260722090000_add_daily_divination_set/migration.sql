-- CreateTable
CREATE TABLE "DailyDivinationSet" (
    "dayKey" VARCHAR(10) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'GENERATING',
    "slips" JSONB,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMPTZ(3),
    "nextRetryAt" TIMESTAMPTZ(3),
    "lastErrorCode" VARCHAR(32),
    "generatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyDivinationSet_pkey" PRIMARY KEY ("dayKey"),
    CONSTRAINT "DailyDivinationSet_dayKey_format_check"
      CHECK ("dayKey" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
    CONSTRAINT "DailyDivinationSet_status_check"
      CHECK ("status" IN ('GENERATING', 'READY', 'FAILED')),
    CONSTRAINT "DailyDivinationSet_ready_payload_check"
      CHECK ("status" <> 'READY' OR ("slips" IS NOT NULL AND "generatedAt" IS NOT NULL))
);

-- CreateIndex
CREATE INDEX "DailyDivinationSet_status_nextRetryAt_idx"
ON "DailyDivinationSet"("status", "nextRetryAt");
