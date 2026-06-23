-- Add verification table for Better Auth
-- Run this in your Neon PostgreSQL database

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on identifier for faster lookups
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
