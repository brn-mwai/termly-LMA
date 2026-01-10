-- Add notification preferences column to users table
-- Stores user notification settings as JSONB for flexibility

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "alerts": {
    "breach": true,
    "warning": true,
    "info": false
  },
  "digest": {
    "enabled": true,
    "frequency": "weekly"
  }
}'::jsonb;

-- Add index for querying users with specific preferences (e.g., digest enabled)
CREATE INDEX IF NOT EXISTS idx_users_notification_prefs
ON users USING gin (notification_preferences);

-- Comment for documentation
COMMENT ON COLUMN users.notification_preferences IS 'User notification preferences: alerts (breach/warning/info toggles) and digest (enabled/frequency)';
