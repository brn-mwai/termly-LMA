-- Add onboarding fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(clerk_id, onboarding_completed);
