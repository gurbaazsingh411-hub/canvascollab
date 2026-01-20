-- ENSURE REALTIME REPLICATION
-- This migration enables Postgres CDC (Change Data Capture) for tables that require real-time syncing.

-- Add tables to the 'supabase_realtime' publication
-- If they are already there, this will simply ensure they stay there.
BEGIN;
  -- Remove if exists to avoid duplicates in some Supabase versions, though not strictly necessary
  -- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS documents;
  -- ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS spreadsheet_cells;

  -- Add tables
  ALTER PUBLICATION supabase_realtime ADD TABLE documents;
  ALTER PUBLICATION supabase_realtime ADD TABLE spreadsheet_cells;
COMMIT;

-- Set replica identity to FULL for these tables
-- This ensures that the 'OLD' record is included in the CDC payload for updates/deletes
ALTER TABLE documents REPLICA IDENTITY FULL;
ALTER TABLE spreadsheet_cells REPLICA IDENTITY FULL;
