-- Clean schema for specifications table
-- This creates a production-ready schema with proper constraints and indexes

-- Create specifications table with all necessary columns
CREATE TABLE IF NOT EXISTS specifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  tags TEXT DEFAULT '[]', -- JSON array stored as text
  user_id TEXT NOT NULL, -- Auth0 user ID
  parent_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES specifications(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_id ON specifications(user_id);
CREATE INDEX IF NOT EXISTS idx_title ON specifications(title);
CREATE INDEX IF NOT EXISTS idx_created_at ON specifications(created_at);
CREATE INDEX IF NOT EXISTS idx_updated_at ON specifications(updated_at);
CREATE INDEX IF NOT EXISTS idx_version ON specifications(version);
CREATE INDEX IF NOT EXISTS idx_parent_id ON specifications(parent_id);

-- Create a view for easier querying of latest versions
CREATE VIEW IF NOT EXISTS latest_specifications AS
SELECT s1.*
FROM specifications s1
LEFT JOIN specifications s2 
  ON s1.title = s2.title 
  AND s1.user_id = s2.user_id
  AND s1.created_at < s2.created_at
WHERE s2.id IS NULL;