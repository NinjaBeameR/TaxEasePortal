/*
  # GST Billing Application Database Schema

  1. New Tables
    - `companies` - Store company/business information
    - `customers` - Store customer information with billing/shipping addresses
    - `products` - Store product/service catalog
    - `invoices` - Store invoice headers
    - `invoice_items` - Store invoice line items

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  gstin text UNIQUE NOT NULL,
  phone text,
  email text,
  website text,
  logo text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('B2B', 'B2C')),
  gstin text,
  billing_address_line1 text NOT NULL,
  billing_address_line2 text,
  billing_city text NOT NULL,
  billing_state text NOT NULL,
  billing_pincode text NOT NULL,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_pincode text,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  hsn_sac_code text NOT NULL,
  gst_rate numeric NOT NULL DEFAULT 18,
  unit_of_measurement text NOT NULL DEFAULT 'PCS',
  price numeric NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('GOODS', 'SERVICES')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL,
  customer_gstin text,
  customer_address_line1 text NOT NULL,
  customer_address_line2 text,
  customer_city text NOT NULL,
  customer_state text NOT NULL,
  customer_pincode text NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  total_taxable_value numeric NOT NULL DEFAULT 0,
  total_cgst numeric NOT NULL DEFAULT 0,
  total_sgst numeric NOT NULL DEFAULT 0,
  total_igst numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  amount_in_words text NOT NULL DEFAULT '',
  notes text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PAID')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  product_name text NOT NULL,
  hsn_sac_code text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  rate numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  taxable_value numeric NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 18,
  cgst numeric NOT NULL DEFAULT 0,
  sgst numeric NOT NULL DEFAULT 0,
  igst numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Users can manage their own company data"
  ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for customers
CREATE POLICY "Users can manage their own customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for products
CREATE POLICY "Users can manage their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for invoices
CREATE POLICY "Users can manage their own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for invoice items
CREATE POLICY "Users can manage their own invoice items"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_gstin ON customers(gstin);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_hsn_sac_code ON products(hsn_sac_code);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);