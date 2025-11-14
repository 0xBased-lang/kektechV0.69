-- CreateTable
CREATE TABLE IF NOT EXISTS "IndexedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "marketAddress" TEXT,
    "blockNumber" BIGINT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "eventData" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT FALSE,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "IndexedEvent_transactionHash_logIndex_key" ON "IndexedEvent"("transactionHash", "logIndex");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IndexedEvent_marketAddress_idx" ON "IndexedEvent"("marketAddress");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IndexedEvent_blockNumber_idx" ON "IndexedEvent"("blockNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IndexedEvent_eventType_idx" ON "IndexedEvent"("eventType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IndexedEvent_processed_idx" ON "IndexedEvent"("processed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IndexedEvent_timestamp_idx" ON "IndexedEvent"("timestamp");

