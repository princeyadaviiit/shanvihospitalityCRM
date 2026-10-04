-- Add createdById to track who created each lead (for admin tracking)
ALTER TABLE leads ADD COLUMN created_by_id TEXT;

-- Add index for efficient queries
CREATE INDEX leads_created_by_id_idx ON leads(company_id, created_by_id);

-- Add foreign key constraint
ALTER TABLE leads ADD CONSTRAINT leads_created_by_id_fkey
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL;
