CREATE TABLE IF NOT EXISTS "USER" (
  username VARCHAR(50) PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  fullname VARCHAR(120) NOT NULL,
  currency_preferred VARCHAR(12) NOT NULL DEFAULT 'USD',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CATEGORY" (
  cat_id SERIAL PRIMARY KEY,
  cat_name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "PAYMENT_MODE" (
  mode_id SERIAL PRIMARY KEY,
  mode_name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "PAYMENT" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  cat_id INTEGER NOT NULL REFERENCES "CATEGORY"(cat_id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  mode_id INTEGER NOT NULL REFERENCES "PAYMENT_MODE"(mode_id) ON DELETE RESTRICT,
  note VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "EXPENSE" (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  payment_id INTEGER NOT NULL UNIQUE REFERENCES "PAYMENT"(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SHARED_EXPENSE" (
  id SERIAL PRIMARY KEY,
  paid_username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  owed_username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  payment_id INTEGER NOT NULL REFERENCES "PAYMENT"(id) ON DELETE CASCADE,
  amount_owed NUMERIC(12, 2) NOT NULL CHECK (amount_owed >= 0),
  amount_repaid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_repaid >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT shared_expense_unique_participant UNIQUE (payment_id, owed_username),
  CONSTRAINT shared_expense_not_self CHECK (paid_username <> owed_username),
  CONSTRAINT shared_expense_amount_valid CHECK (amount_repaid <= amount_owed)
);

CREATE TABLE IF NOT EXISTS "REPAYMENTS" (
  id SERIAL PRIMARY KEY,
  shared_expense_id INTEGER NOT NULL REFERENCES "SHARED_EXPENSE"(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "FRIENDS" (
  u1_username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  u2_username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (u1_username, u2_username),
  CONSTRAINT friends_no_self CHECK (u1_username <> u2_username),
  CONSTRAINT friends_ordered CHECK (u1_username < u2_username)
);

CREATE TABLE IF NOT EXISTS "FRIEND_REQUEST" (
  id SERIAL PRIMARY KEY,
  sender_username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  receiver_username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT friend_request_no_self CHECK (sender_username <> receiver_username),
  CONSTRAINT friend_request_unique UNIQUE (sender_username, receiver_username)
);

CREATE TABLE IF NOT EXISTS "BUDGET" (
  username VARCHAR(50) NOT NULL REFERENCES "USER"(username) ON DELETE CASCADE,
  cat_id INTEGER NOT NULL REFERENCES "CATEGORY"(cat_id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, cat_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_date ON "PAYMENT"(date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_username ON "EXPENSE"(username);
CREATE INDEX IF NOT EXISTS idx_shared_owed ON "SHARED_EXPENSE"(owed_username, status);
CREATE INDEX IF NOT EXISTS idx_shared_paid ON "SHARED_EXPENSE"(paid_username, status);
CREATE INDEX IF NOT EXISTS idx_repayments_shared_expense ON "REPAYMENTS"(shared_expense_id);
CREATE INDEX IF NOT EXISTS idx_friend_request_receiver ON "FRIEND_REQUEST"(receiver_username, status);
CREATE INDEX IF NOT EXISTS idx_budget_username ON "BUDGET"(username);
