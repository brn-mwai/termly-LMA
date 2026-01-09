-- Add test_due_date column to covenants table
ALTER TABLE covenants ADD COLUMN IF NOT EXISTS test_due_date DATE;

-- Create index for upcoming tests query
CREATE INDEX IF NOT EXISTS idx_covenants_test_due_date ON covenants(test_due_date);

-- Comment
COMMENT ON COLUMN covenants.test_due_date IS 'Next scheduled test date for the covenant';
