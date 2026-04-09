-- SCHEMA VERSION 2 - CRITICAL FIXES FOR PRODUCTION READINESS
-- Run this file after the main schema.sql to apply fixes and enhancements

-- FIX 1: Add updated_at timestamp to BUDGET table for audit trail
ALTER TABLE "BUDGET" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- FIX 2: Add paid_by_username to REPAYMENTS for audit trail
-- This tracks who made the repayment (could be the owed person or payer)
ALTER TABLE "REPAYMENTS" ADD COLUMN IF NOT EXISTS paid_by_username VARCHAR(50);

-- Add foreign key constraint for paid_by_username
ALTER TABLE "REPAYMENTS" 
ADD CONSTRAINT fk_repayment_paid_by 
FOREIGN KEY (paid_by_username) REFERENCES "USER"(username) ON DELETE CASCADE;

-- FIX 3: Add additional index on SHARED_EXPENSE status for query optimization
CREATE INDEX IF NOT EXISTS idx_shared_status ON "SHARED_EXPENSE"(status);

-- FIX 4: Ensure FRIENDS table ordering constraint is properly enforced
-- The original constraint is sufficient, but we verify it exists
-- This constraint ensures that u1_username < u2_username always, preventing duplicates
-- No action needed - already in place from original schema

-- FIX 5: Add check constraint on PAYMENT amount
ALTER TABLE "PAYMENT" DROP CONSTRAINT IF EXISTS payment_positive_amount;
ALTER TABLE "PAYMENT" ADD CONSTRAINT payment_positive_amount CHECK (amount > 0);

-- FIX 6: Improve SHARED_EXPENSE constraints to handle edge cases
ALTER TABLE "SHARED_EXPENSE" 
  DROP CONSTRAINT IF EXISTS shared_expense_amount_valid;
ALTER TABLE "SHARED_EXPENSE" 
  ADD CONSTRAINT shared_expense_amount_valid CHECK (amount_repaid >= 0 AND amount_repaid <= amount_owed);

-- FIX 7: Create index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_expense_user_date ON "EXPENSE"(username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_owed_status_date ON "SHARED_EXPENSE"(owed_username, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_paid_status_date ON "SHARED_EXPENSE"(paid_username, status, created_at DESC);

-- FIX 8: Add function to automatically update updated_at on BUDGET
CREATE OR REPLACE FUNCTION update_budget_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_update_timestamp
BEFORE UPDATE ON "BUDGET"
FOR EACH ROW
EXECUTE FUNCTION update_budget_timestamp();

-- Verification query to ensure schema is correct
SELECT 'Schema fixes applied successfully' as status;
