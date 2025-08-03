/*
  # Update Invoice Status Values
  
  1. Changes
    - Update the status column constraint to only allow 'CREDIT' and 'PAID'
    - Migrate existing data: 'DRAFT' and 'SENT' -> 'CREDIT', 'PAID' stays 'PAID'
    - Add vehicle_id column if it doesn't exist
    - Add user_id and company_id columns for proper RLS

  2. Security
    - Maintain existing RLS policies
*/

-- First, add missing columns if they don't exist
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS vehicle_id uuid;

-- Update existing data: migrate old statuses to new ones
UPDATE invoices 
SET status = CASE 
  WHEN status IN ('DRAFT', 'SENT') THEN 'CREDIT'
  WHEN status = 'PAID' THEN 'PAID'
  ELSE 'CREDIT'
END
WHERE status NOT IN ('CREDIT', 'PAID');

-- Drop the old constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Add the new constraint with only 'CREDIT' and 'PAID'
ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('CREDIT', 'PAID'));

-- Update default status to 'CREDIT'
ALTER TABLE invoices 
ALTER COLUMN status SET DEFAULT 'CREDIT';

-- Update the RLS policy to include user_id filtering
DROP POLICY IF EXISTS "Users can manage their own invoices" ON invoices;

CREATE POLICY "Users can manage their own invoices"
  ON invoices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle_id ON invoices(vehicle_id);
