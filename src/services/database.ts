import { Company, Customer, Product, Invoice } from '../types';
import { supabase } from './supabase';

// Supabase database service
class DatabaseService {
  async init(): Promise<void> {
    // No initialization needed for Supabase
    return Promise.resolve();
  }

  // Company operations
  async saveCompany(company: Company): Promise<void> {
    const companyData = {
      id: company.id,
      business_name: company.businessName,
      address_line1: company.address.line1,
      address_line2: company.address.line2 || null,
      city: company.address.city,
      state: company.address.state,
      pincode: company.address.pincode,
      gstin: company.gstin,
      phone: company.contact.phone || null,
      email: company.contact.email || null,
      website: company.contact.website || null,
      logo: company.logo || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('companies')
      .upsert(companyData);

    if (error) throw error;
  }

  async getCompany(): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null; // or return [] for arrays

    return {
      id: data.id,
      businessName: data.business_name,
      address: {
        line1: data.address_line1,
        line2: data.address_line2 || '',
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
      gstin: data.gstin,
      contact: {
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
      },
      logo: data.logo,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Customer operations
  async saveCustomer(customer: Customer): Promise<void> {
    const customerData = {
      id: customer.id,
      name: customer.name,
      type: customer.type,
      gstin: customer.gstin || null,
      billing_address_line1: customer.billingAddress.line1,
      billing_address_line2: customer.billingAddress.line2 || null,
      billing_city: customer.billingAddress.city,
      billing_state: customer.billingAddress.state,
      billing_pincode: customer.billingAddress.pincode,
      shipping_address_line1: customer.shippingAddress?.line1 || null,
      shipping_address_line2: customer.shippingAddress?.line2 || null,
      shipping_city: customer.shippingAddress?.city || null,
      shipping_state: customer.shippingAddress?.state || null,
      shipping_pincode: customer.shippingAddress?.pincode || null,
      phone: customer.contact.phone || null,
      email: customer.contact.email || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('customers')
      .upsert(customerData);

    if (error) throw error;
  }

  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw error;
    if (!data || !Array.isArray(data)) return [];

    return data.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as 'B2B' | 'B2C',
      gstin: row.gstin,
      billingAddress: {
        line1: row.billing_address_line1,
        line2: row.billing_address_line2 || '',
        city: row.billing_city,
        state: row.billing_state,
        pincode: row.billing_pincode,
      },
      shippingAddress: row.shipping_address_line1 ? {
        line1: row.shipping_address_line1,
        line2: row.shipping_address_line2 || '',
        city: row.shipping_city!,
        state: row.shipping_state!,
        pincode: row.shipping_pincode!,
      } : undefined,
      contact: {
        phone: row.phone || '',
        email: row.email || '',
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null; // or return [] for arrays

    return {
      id: data.id,
      name: data.name,
      type: data.type as 'B2B' | 'B2C',
      gstin: data.gstin,
      billingAddress: {
        line1: data.billing_address_line1,
        line2: data.billing_address_line2 || '',
        city: data.billing_city,
        state: data.billing_state,
        pincode: data.billing_pincode,
      },
      shippingAddress: data.shipping_address_line1 ? {
        line1: data.shipping_address_line1,
        line2: data.shipping_address_line2 || '',
        city: data.shipping_city!,
        state: data.shipping_state!,
        pincode: data.shipping_pincode!,
      } : undefined,
      contact: {
        phone: data.phone || '',
        email: data.email || '',
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Product operations
  async saveProduct(product: Product): Promise<void> {
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description || null,
      hsn_sac_code: product.hsnSacCode,
      gst_rate: product.gstRate,
      unit_of_measurement: product.unitOfMeasurement,
      price: product.price,
      type: product.type,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('products')
      .upsert(productData);

    if (error) throw error;
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) throw error;
    if (!data || !Array.isArray(data)) return [];

    return data.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      hsnSacCode: row.hsn_sac_code,
      gstRate: row.gst_rate,
      unitOfMeasurement: row.unit_of_measurement,
      price: row.price,
      type: row.type as 'GOODS' | 'SERVICES',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null; // or return [] for arrays

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      hsnSacCode: data.hsn_sac_code,
      gstRate: data.gst_rate,
      unitOfMeasurement: data.unit_of_measurement,
      price: data.price,
      type: data.type as 'GOODS' | 'SERVICES',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Invoice operations
  async saveInvoice(invoice: Invoice): Promise<void> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.id) throw new Error('User not authenticated');

    // Fetch company for this user
    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (!companyData || !companyData.id) throw new Error('Company not found for user');

    // Prepare invoice data
    const invoiceData = {
      id: invoice.id,
      user_id: user.id, // Required for RLS!
      company_id: companyData.id,
      invoice_number: invoice.invoiceNumber,
      date: invoice.date,
      customer_id: invoice.customerId,
      customer_name: invoice.customerName,
      customer_gstin: invoice.customerGstin || null,
      customer_address_line1: invoice.customerAddress.line1,
      customer_address_line2: invoice.customerAddress.line2 || null,
      customer_city: invoice.customerAddress.city,
      customer_state: invoice.customerAddress.state,
      customer_pincode: invoice.customerAddress.pincode,
      subtotal: invoice.subtotal,
      total_taxable_value: invoice.totalTaxableValue,
      total_cgst: invoice.totalCgst,
      total_sgst: invoice.totalSgst,
      total_igst: invoice.totalIgst,
      total_amount: invoice.totalAmount,
      amount_in_words: invoice.amountInWords,
      notes: invoice.notes || null,
      status: invoice.status,
      updated_at: new Date().toISOString(),
    };

    // Save invoice
    const { error: invoiceError } = await supabase
      .from('invoices')
      .upsert(invoiceData);

    if (invoiceError) throw invoiceError;

    // Delete existing items and insert new ones
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoice.id);

    if (deleteError) throw deleteError;

    // Prepare invoice items
    const itemsData = invoice.items.map(item => ({
      id: item.id,
      invoice_id: invoice.id,
      product_id: item.productId || null,
      product_name: item.productName,
      hsn_sac_code: item.hsnSacCode,
      quantity: item.quantity,
      rate: item.rate,
      discount: item.discount || 0,
      taxable_value: item.taxableValue,
      gst_rate: item.gstRate,
      cgst: item.cgst || 0,
      sgst: item.sgst || 0,
      igst: item.igst || 0,
      total_amount: item.totalAmount,
    }));

    if (itemsData.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsData);

      if (itemsError) throw itemsError;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.id) return [];

    // Only fetch invoices for current user
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id) // <-- This line filters invoices by user
      .order('date', { ascending: false });

    if (invoicesError) throw invoicesError;
    if (!invoicesData || !Array.isArray(invoicesData)) return [];

    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .order('created_at');

    if (itemsError) throw itemsError;
    if (!itemsData || !Array.isArray(itemsData)) return invoicesData.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      date: invoice.date,
      customerId: invoice.customer_id,
      customerName: invoice.customer_name,
      customerGstin: invoice.customer_gstin,
      customerAddress: {
        line1: invoice.customer_address_line1,
        line2: invoice.customer_address_line2 || '',
        city: invoice.customer_city,
        state: invoice.customer_state,
        pincode: invoice.customer_pincode,
      },
      items: [],
      subtotal: invoice.subtotal,
      totalTaxableValue: invoice.total_taxable_value,
      totalCgst: invoice.total_cgst,
      totalSgst: invoice.total_sgst,
      totalIgst: invoice.total_igst,
      totalAmount: invoice.total_amount,
      amountInWords: invoice.amount_in_words,
      notes: invoice.notes,
      status: invoice.status as 'DRAFT' | 'SENT' | 'PAID',
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
    }));

    return invoicesData.map(invoice => {
      const items = itemsData
        .filter(item => item.invoice_id === invoice.id)
        .map(item => ({
          id: item.id,
          productId: item.product_id || '',
          productName: item.product_name,
          hsnSacCode: item.hsn_sac_code,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          taxableValue: item.taxable_value,
          gstRate: item.gst_rate,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          totalAmount: item.total_amount,
        }));

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        date: invoice.date,
        customerId: invoice.customer_id,
        customerName: invoice.customer_name,
        customerGstin: invoice.customer_gstin,
        customerAddress: {
          line1: invoice.customer_address_line1,
          line2: invoice.customer_address_line2 || '',
          city: invoice.customer_city,
          state: invoice.customer_state,
          pincode: invoice.customer_pincode,
        },
        items,
        subtotal: invoice.subtotal,
        totalTaxableValue: invoice.total_taxable_value,
        totalCgst: invoice.total_cgst,
        totalSgst: invoice.total_sgst,
        totalIgst: invoice.total_igst,
        totalAmount: invoice.total_amount,
        amountInWords: invoice.amount_in_words,
        notes: invoice.notes,
        status: invoice.status as 'DRAFT' | 'SENT' | 'PAID',
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      };
    });
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError && invoiceError.code !== 'PGRST116') throw invoiceError;
    if (!invoiceData) return null;

    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at');

    if (itemsError) throw itemsError;
    if (!itemsData || !Array.isArray(itemsData)) return {
      id: invoiceData.id,
      invoiceNumber: invoiceData.invoice_number,
      date: invoiceData.date,
      customerId: invoiceData.customer_id,
      customerName: invoiceData.customer_name,
      customerGstin: invoiceData.customer_gstin,
      customerAddress: {
        line1: invoiceData.customer_address_line1,
        line2: invoiceData.customer_address_line2 || '',
        city: invoiceData.customer_city,
        state: invoiceData.customer_state,
        pincode: invoiceData.customer_pincode,
      },
      items: [],
      subtotal: invoiceData.subtotal,
      totalTaxableValue: invoiceData.total_taxable_value,
      totalCgst: invoiceData.total_cgst,
      totalSgst: invoiceData.total_sgst,
      totalIgst: invoiceData.total_igst,
      totalAmount: invoiceData.total_amount,
      amountInWords: invoiceData.amount_in_words,
      notes: invoiceData.notes,
      status: invoiceData.status as 'DRAFT' | 'SENT' | 'PAID',
      createdAt: invoiceData.created_at,
      updatedAt: invoiceData.updated_at,
    };

    const items = itemsData.map(item => ({
      id: item.id,
      productId: item.product_id || '',
      productName: item.product_name,
      hsnSacCode: item.hsn_sac_code,
      quantity: item.quantity,
      rate: item.rate,
      discount: item.discount,
      taxableValue: item.taxable_value,
      gstRate: item.gst_rate,
      cgst: item.cgst,
      sgst: item.sgst,
      igst: item.igst,
      totalAmount: item.total_amount,
    }));

    return {
      id: invoiceData.id,
      invoiceNumber: invoiceData.invoice_number,
      date: invoiceData.date,
      customerId: invoiceData.customer_id,
      customerName: invoiceData.customer_name,
      customerGstin: invoiceData.customer_gstin,
      customerAddress: {
        line1: invoiceData.customer_address_line1,
        line2: invoiceData.customer_address_line2 || '',
        city: invoiceData.customer_city,
        state: invoiceData.customer_state,
        pincode: invoiceData.customer_pincode,
      },
      items,
      subtotal: invoiceData.subtotal,
      totalTaxableValue: invoiceData.total_taxable_value,
      totalCgst: invoiceData.total_cgst,
      totalSgst: invoiceData.total_sgst,
      totalIgst: invoiceData.total_igst,
      totalAmount: invoiceData.total_amount,
      amountInWords: invoiceData.amount_in_words,
      notes: invoiceData.notes,
      status: invoiceData.status as 'DRAFT' | 'SENT' | 'PAID',
      createdAt: invoiceData.created_at,
      updatedAt: invoiceData.updated_at,
    };
  }

  async getNextInvoiceNumber(): Promise<string> {
    // Your logic to fetch company and generate next invoice number
    // Example:
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.id) throw new Error('User not authenticated');
    const { data } = await supabase
      .from('companies')
      .select('invoice_prefix, last_invoice_number')
      .eq('user_id', user.id)
      .single();
    const prefix = data?.invoice_prefix || 'INV-';
    const nextNumber = (data?.last_invoice_number || 1000) + 1;
    return `${prefix}${nextNumber}`;
  }

  // Settings operations
  async saveSetting(key: string, value: any): Promise<void> {
    // For now, we'll skip settings as they're not critical for the core functionality
    // In a real implementation, you might create a settings table
    void key;
    void value;
    return Promise.resolve();
  }

  async getSetting(key: string): Promise<any> {
    // For now, we'll skip settings as they're not critical for the core functionality
    void key;
    return Promise.resolve(null);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    // Delete invoice items first (to avoid foreign key constraint)
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    // Then delete the invoice
    await supabase.from('invoices').delete().eq('id', invoiceId);
  }
}

export const db = new DatabaseService();