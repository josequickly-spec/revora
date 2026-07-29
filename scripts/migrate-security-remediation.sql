-- Quarantine the operational dataset created before tenant ownership existed.
-- The first authenticated organization to use a legacy route atomically claims
-- the dataset. Other organizations are denied instead of sharing its records.
CREATE TABLE IF NOT EXISTS platform_legacy_dataset_owner (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  organization_id UUID NOT NULL UNIQUE
    REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_by UUID REFERENCES enterprise_users(id) ON DELETE SET NULL
);

COMMENT ON TABLE platform_legacy_dataset_owner IS
  'Ownership boundary for the pre-tenant operational dataset.';
