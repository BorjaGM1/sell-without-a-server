-- Add-on C2 (GUIDE.md, "Email signup form"). Applied with: npx wrangler d1 migrations apply SUBSCRIBERS --remote
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,   -- lowercased
  created_at TEXT NOT NULL, -- ISO time of the sign-up: your record of when they opted in
  source TEXT               -- the page the form was on
);
CREATE INDEX IF NOT EXISTS subscribers_created ON subscribers (created_at);
