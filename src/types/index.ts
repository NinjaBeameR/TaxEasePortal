// Core Types for GST Billing Application

export interface Company {
  id: string;
  businessName: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  gstin: string;
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  logo?: string;
  createdAt: string; // was Date
  updatedAt: string; // was Date
}

export interface Customer {
  id: string;
  name: string;
  gstin?: string;
  type: 'B2B' | 'B2C';
  billingAddress: Address;
  shippingAddress?: Address;
  contact: {
    phone?: string;
    email?: string;
  };
  createdAt: string; // was Date
  updatedAt: string; // was Date
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  hsnSacCode: string;
  gstRate: number;
  unitOfMeasurement: string;
  price: number;
  type: 'GOODS' | 'SERVICES';
  createdAt: string; // was Date
  updatedAt: string; // was Date
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  hsnSacCode: string;
  quantity: number;
  rate: number;
  discount?: number;
  taxableValue: number;
  gstRate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // was Date
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalAmount: number;
  amountInWords: string;
  notes?: string;
  status: string;
  createdAt: string; // was Date
  updatedAt: string; // was Date
  vehicle_id?: string;
}

export interface TaxCalculation {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
}

// Indian states with their codes
export const INDIAN_STATES = {
  'Andhra Pradesh': '37',
  'Arunachal Pradesh': '12',
  'Assam': '18',
  'Bihar': '10',
  'Chhattisgarh': '22',
  'Goa': '30',
  'Gujarat': '24',
  'Haryana': '06',
  'Himachal Pradesh': '02',
  'Jharkhand': '20',
  'Karnataka': '29',
  'Kerala': '32',
  'Madhya Pradesh': '23',
  'Maharashtra': '27',
  'Manipur': '14',
  'Meghalaya': '17',
  'Mizoram': '15',
  'Nagaland': '13',
  'Odisha': '21',
  'Punjab': '03',
  'Rajasthan': '08',
  'Sikkim': '11',
  'Tamil Nadu': '33',
  'Telangana': '36',
  'Tripura': '16',
  'Uttar Pradesh': '09',
  'Uttarakhand': '05',
  'West Bengal': '19',
  'Andaman and Nicobar Islands': '35',
  'Chandigarh': '04',
  'Dadra and Nagar Haveli and Daman and Diu': '26',
  'Delhi': '07',
  'Jammu and Kashmir': '01',
  'Ladakh': '38',
  'Lakshadweep': '31',
  'Puducherry': '34'
};

export const GST_RATES = [0, 5, 12, 18, 28];

// Add this interface
export interface Vehicle {
  id: string;
  user_id: string;
  vehicle_number: string;
  created_at: string;
}