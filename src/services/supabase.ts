import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          business_name: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          pincode: string;
          gstin: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          logo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          gstin: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          gstin?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          type: 'B2B' | 'B2C';
          gstin: string | null;
          billing_address_line1: string;
          billing_address_line2: string | null;
          billing_city: string;
          billing_state: string;
          billing_pincode: string;
          shipping_address_line1: string | null;
          shipping_address_line2: string | null;
          shipping_city: string | null;
          shipping_state: string | null;
          shipping_pincode: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'B2B' | 'B2C';
          gstin?: string | null;
          billing_address_line1: string;
          billing_address_line2?: string | null;
          billing_city: string;
          billing_state: string;
          billing_pincode: string;
          shipping_address_line1?: string | null;
          shipping_address_line2?: string | null;
          shipping_city?: string | null;
          shipping_state?: string | null;
          shipping_pincode?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'B2B' | 'B2C';
          gstin?: string | null;
          billing_address_line1?: string;
          billing_address_line2?: string | null;
          billing_city?: string;
          billing_state?: string;
          billing_pincode?: string;
          shipping_address_line1?: string | null;
          shipping_address_line2?: string | null;
          shipping_city?: string | null;
          shipping_state?: string | null;
          shipping_pincode?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          hsn_sac_code: string;
          gst_rate: number;
          unit_of_measurement: string;
          price: number;
          type: 'GOODS' | 'SERVICES';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          hsn_sac_code: string;
          gst_rate: number;
          unit_of_measurement: string;
          price: number;
          type: 'GOODS' | 'SERVICES';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          hsn_sac_code?: string;
          gst_rate?: number;
          unit_of_measurement?: string;
          price?: number;
          type?: 'GOODS' | 'SERVICES';
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          date: string;
          customer_id: string;
          customer_name: string;
          customer_gstin: string | null;
          customer_address_line1: string;
          customer_address_line2: string | null;
          customer_city: string;
          customer_state: string;
          customer_pincode: string;
          subtotal: number;
          total_taxable_value: number;
          total_cgst: number;
          total_sgst: number;
          total_igst: number;
          total_amount: number;
          amount_in_words: string;
          notes: string | null;
          status: 'DRAFT' | 'SENT' | 'PAID';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          date: string;
          customer_id: string;
          customer_name: string;
          customer_gstin?: string | null;
          customer_address_line1: string;
          customer_address_line2?: string | null;
          customer_city: string;
          customer_state: string;
          customer_pincode: string;
          subtotal: number;
          total_taxable_value: number;
          total_cgst: number;
          total_sgst: number;
          total_igst: number;
          total_amount: number;
          amount_in_words: string;
          notes?: string | null;
          status: 'DRAFT' | 'SENT' | 'PAID';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          date?: string;
          customer_id?: string;
          customer_name?: string;
          customer_gstin?: string | null;
          customer_address_line1?: string;
          customer_address_line2?: string | null;
          customer_city?: string;
          customer_state?: string;
          customer_pincode?: string;
          subtotal?: number;
          total_taxable_value?: number;
          total_cgst?: number;
          total_sgst?: number;
          total_igst?: number;
          total_amount?: number;
          amount_in_words?: string;
          notes?: string | null;
          status?: 'DRAFT' | 'SENT' | 'PAID';
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          product_id: string | null;
          product_name: string;
          hsn_sac_code: string;
          quantity: number;
          rate: number;
          discount: number;
          taxable_value: number;
          gst_rate: number;
          cgst: number;
          sgst: number;
          igst: number;
          total_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          product_id?: string | null;
          product_name: string;
          hsn_sac_code: string;
          quantity: number;
          rate: number;
          discount?: number;
          taxable_value: number;
          gst_rate: number;
          cgst: number;
          sgst: number;
          igst: number;
          total_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          product_id?: string | null;
          product_name?: string;
          hsn_sac_code?: string;
          quantity?: number;
          rate?: number;
          discount?: number;
          taxable_value?: number;
          gst_rate?: number;
          cgst?: number;
          sgst?: number;
          igst?: number;
          total_amount?: number;
          created_at?: string;
        };
      };
    };
  };
}