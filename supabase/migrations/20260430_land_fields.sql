-- Land-specific classification fields.
-- Nullable text columns with CHECK constraints so the DB enforces the domain enum
-- without requiring a Postgres TYPE, which is harder to ALTER later.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS land_legal_status text
    CHECK (land_legal_status IN ('agricultural', 'urban', 'forest', 'pasture')),
  ADD COLUMN IF NOT EXISTS land_zoning text
    CHECK (land_zoning IN ('residential', 'commercial', 'tourism', 'industrial', 'mixed_use')),
  ADD COLUMN IF NOT EXISTS land_development_potential text
    CHECK (land_development_potential IN ('buildable', 'change_of_use_required', 'non_buildable'));
