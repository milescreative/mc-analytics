export const schema = `-- CreateTable
CREATE TABLE IF NOT EXISTS "events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT,
    "meta" TEXT,
    "props" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_domain_timestamp_idx" ON "events"("domain", "timestamp");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_session_id_idx" ON "events"("session_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "events_country_region_city_idx" ON "events"("country", "region", "city");
`;
