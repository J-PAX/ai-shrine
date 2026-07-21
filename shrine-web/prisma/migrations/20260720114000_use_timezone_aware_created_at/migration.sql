-- Preserve existing timestamps as UTC instants, then store future values with timezone awareness.
ALTER TABLE "RitualEvent"
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
