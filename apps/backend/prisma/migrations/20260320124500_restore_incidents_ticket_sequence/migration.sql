-- Repair migration: restore automatic ticket number generation for incidents.
-- A previous migration dropped the default sequence, causing INSERT failures.

DO $$
DECLARE
  next_ticket BIGINT;
BEGIN
  IF to_regclass('public.bd_incidents') IS NULL THEN
    RETURN;
  END IF;

  IF to_regclass('public.bd_incidents_ticket_number_seq') IS NULL THEN
    CREATE SEQUENCE "bd_incidents_ticket_number_seq";
  END IF;

  ALTER SEQUENCE "bd_incidents_ticket_number_seq"
    OWNED BY "bd_incidents"."ticket_number";

  ALTER TABLE "bd_incidents"
    ALTER COLUMN "ticket_number"
    SET DEFAULT nextval('bd_incidents_ticket_number_seq');

  SELECT COALESCE(MAX("ticket_number"), 0) + 1
  INTO next_ticket
  FROM "bd_incidents";

  PERFORM setval('bd_incidents_ticket_number_seq', next_ticket, false);
END $$;
