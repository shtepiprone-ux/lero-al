-- Domain refactor: rename property_type enum value storage → warehouse.
--
-- In PostgreSQL, ALTER TYPE RENAME VALUE updates only the catalog (pg_enum).
-- Existing rows reference the enum OID, which does not change, so they
-- automatically display the new label — no UPDATE on listings is required.
--
-- This statement is safe to re-run: the DO block checks for the old label first.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'property_type' AND e.enumlabel = 'storage'
  ) THEN
    ALTER TYPE property_type RENAME VALUE 'storage' TO 'warehouse';
  END IF;
END $$;
