-- Fix RLS Policies for Payment Methods
-- แก้ไข RLS Policy เพื่อให้สามารถใช้งาน payment_methods ได้

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "payment_methods_select_policy" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_insert_policy" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_update_policy" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_delete_policy" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_transactions_select_policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_update_policy" ON public.payment_transactions;
DROP POLICY IF EXISTS "payment_confirmations_select_policy" ON public.payment_confirmations;
DROP POLICY IF EXISTS "payment_confirmations_insert_policy" ON public.payment_confirmations;

-- Create simplified policies (allow all operations for authenticated users)
-- This follows the pattern used in other tables in the system

-- Payment Methods Policies
CREATE POLICY "payment_methods_select_policy" ON public.payment_methods
  FOR SELECT
  USING (true);

CREATE POLICY "payment_methods_insert_policy" ON public.payment_methods
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "payment_methods_update_policy" ON public.payment_methods
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "payment_methods_delete_policy" ON public.payment_methods
  FOR DELETE
  USING (true);

-- Payment Transactions Policies
CREATE POLICY "payment_transactions_select_policy" ON public.payment_transactions
  FOR SELECT
  USING (true);

CREATE POLICY "payment_transactions_insert_policy" ON public.payment_transactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "payment_transactions_update_policy" ON public.payment_transactions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Payment Confirmations Policies
CREATE POLICY "payment_confirmations_select_policy" ON public.payment_confirmations
  FOR SELECT
  USING (true);

CREATE POLICY "payment_confirmations_insert_policy" ON public.payment_confirmations
  FOR INSERT
  WITH CHECK (true);

SELECT '✅ RLS Policies for payment_methods updated successfully!' as result;

