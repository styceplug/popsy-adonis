BEGIN;

ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "checkInCode" VARCHAR(6);
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_checkInCode_key" ON "Ticket" ("checkInCode");

COMMIT;
