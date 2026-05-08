-- Add 'pending' to the listing_status enum.
-- New listings enter this state on creation and are not publicly visible
-- until a moderator approves them (sets status = 'active').
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'pending';
