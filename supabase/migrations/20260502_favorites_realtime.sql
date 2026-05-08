-- Enable REPLICA IDENTITY FULL on favorites so DELETE events include all columns
-- (including listing_id) in the realtime payload.
-- Without this, DELETE payloads only contain the primary key (id),
-- making it impossible to identify which listing was unfavorited in another tab.
-- Run in Supabase SQL Editor.

ALTER TABLE favorites REPLICA IDENTITY FULL;

-- Add favorites to the realtime publication so Supabase broadcasts changes.
ALTER PUBLICATION supabase_realtime ADD TABLE favorites;
