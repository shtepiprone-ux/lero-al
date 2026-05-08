-- Add multi_storey_building flag to listings.
-- Used by garage / parking / warehouse property types to indicate
-- that the unit is inside a multi-floor structure, making the floor
-- field semantically valid and allowing negative (underground) floors.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS multi_storey_building boolean NOT NULL DEFAULT false;
