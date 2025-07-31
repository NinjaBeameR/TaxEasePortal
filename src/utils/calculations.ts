import { INDIAN_STATES, TaxCalculation, InvoiceItem } from '../types';

// Get state code from GSTIN
export const getStateFromGSTIN = (gstin: string): string => {
  if (!gstin || gstin.length < 2) return '';
  return gstin.substring(0, 2);
};

// Check if transaction is inter-state
export const isInterState = (supplierGstin: string, customerGstin?: string): boolean => {
  if (!customerGstin) return false; // B2C transactions within state
  
  const supplierState = getStateFromGSTIN(supplierGstin);
  const customerState = getStateFromGSTIN(customerGstin);
  
  return supplierState !== customerState;
};

// Calculate GST for an item
export const calculateItemGST = (
  taxableValue: number,
  gstRate: number,
  isInterStateTx: boolean
): TaxCalculation => {
  const gstAmount = (taxableValue * gstRate) / 100;
  
  if (isInterStateTx) {
    // Inter-state: IGST only
    return {
      taxableValue,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      totalTax: gstAmount,
      totalAmount: taxableValue + gstAmount
    };
  } else {
    // Intra-state: CGST + SGST (each is half of total GST)
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    
    return {
      taxableValue,
      cgst,
      sgst,
      igst: 0,
      totalTax: cgst + sgst,
      totalAmount: taxableValue + cgst + sgst
    };
  }
};

// Calculate total for multiple items
export const calculateInvoiceTotal = (
  items: InvoiceItem[],
  supplierGstin: string,
  customerGstin?: string
): {
  subtotal: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalAmount: number;
} => {
  const isInterStateTx = isInterState(supplierGstin, customerGstin);
  
  let subtotal = 0;
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalAmount = 0;

  items.forEach(item => {
    const itemTotal = item.quantity * item.rate;
    const discount = item.discount || 0;
    const taxableValue = itemTotal - discount;
    
    const gstCalc = calculateItemGST(taxableValue, item.gstRate, isInterStateTx);
    
    subtotal += itemTotal;
    totalTaxableValue += taxableValue;
    totalCgst += gstCalc.cgst;
    totalSgst += gstCalc.sgst;
    totalIgst += gstCalc.igst;
    totalAmount += gstCalc.totalAmount;
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100
  };
};

// Convert number to words (Indian numbering system)
export const convertToWords = (amount: number): string => {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'
  ];
  
  const teens = [
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const convertHundreds = (num: number): string => {
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      return result;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result;
  };

  if (amount === 0) return 'Zero Rupees Only';
  
  let rupees = Math.floor(amount);
  const paisa = Math.round((amount - rupees) * 100);
  
  let result = '';
  
  if (rupees >= 10000000) {
    result += convertHundreds(Math.floor(rupees / 10000000)) + 'Crore ';
    rupees %= 10000000;
  }
  
  if (rupees >= 100000) {
    result += convertHundreds(Math.floor(rupees / 100000)) + 'Lakh ';
    rupees %= 100000;
  }
  
  if (rupees >= 1000) {
    result += convertHundreds(Math.floor(rupees / 1000)) + 'Thousand ';
    rupees %= 1000;
  }
  
  if (rupees > 0) {
    result += convertHundreds(rupees);
  }
  
  result += 'Rupees';
  
  if (paisa > 0) {
    result += ' and ' + convertHundreds(paisa) + 'Paisa';
  }
  
  result += ' Only';
  
  return result.trim();
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format number with Indian comma separation
export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};