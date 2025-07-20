import { INDIAN_STATES } from '../types';

// GSTIN validation according to Indian GST format
export const validateGSTIN = (gstin: string): { isValid: boolean; error?: string } => {
  if (!gstin) {
    return { isValid: false, error: 'GSTIN is required' };
  }

  // Remove spaces and convert to uppercase
  const cleanGstin = gstin.replace(/\s/g, '').toUpperCase();

  // Check length
  if (cleanGstin.length !== 15) {
    return { isValid: false, error: 'GSTIN must be exactly 15 characters' };
  }

  // Check format: 2 digits + 10 alphanumeric + 1 digit + 1 alphanumeric + 1 alphanumeric
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(cleanGstin)) {
    return { isValid: false, error: 'Invalid GSTIN format' };
  }

  // Check state code
  const stateCode = cleanGstin.substring(0, 2);
  const validStateCodes = Object.values(INDIAN_STATES);
  
  if (!validStateCodes.includes(stateCode)) {
    return { isValid: false, error: 'Invalid state code in GSTIN' };
  }

  return { isValid: true };
};

// HSN/SAC code validation
export const validateHSNSACCode = (code: string): { isValid: boolean; error?: string } => {
  if (!code) {
    return { isValid: false, error: 'HSN/SAC code is required' };
  }

  const cleanCode = code.replace(/\s/g, '');

  // HSN/SAC codes can be 4 to 8 digits
  if (!/^\d{4,8}$/.test(cleanCode)) {
    return { isValid: false, error: 'HSN/SAC code must be 4-8 digits' };
  }

  return { isValid: true };
};

// PAN validation (part of GSTIN)
export const validatePAN = (pan: string): { isValid: boolean; error?: string } => {
  if (!pan) {
    return { isValid: false, error: 'PAN is required' };
  }

  const cleanPan = pan.replace(/\s/g, '').toUpperCase();

  if (cleanPan.length !== 10) {
    return { isValid: false, error: 'PAN must be exactly 10 characters' };
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(cleanPan)) {
    return { isValid: false, error: 'Invalid PAN format' };
  }

  return { isValid: true };
};

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: true }; // Email is optional in many cases
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
};

// Phone number validation
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: true }; // Phone is optional in many cases
  }

  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Phone number must be 10 digits' };
  }

  return { isValid: true };
};

// Pincode validation
export const validatePincode = (pincode: string): { isValid: boolean; error?: string } => {
  if (!pincode) {
    return { isValid: false, error: 'Pincode is required' };
  }

  const cleanPincode = pincode.replace(/\D/g, '');

  if (cleanPincode.length !== 6) {
    return { isValid: false, error: 'Pincode must be 6 digits' };
  }

  return { isValid: true };
};

// Amount validation
export const validateAmount = (amount: number): { isValid: boolean; error?: string } => {
  if (amount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  if (amount > 99999999.99) {
    return { isValid: false, error: 'Amount is too large' };
  }

  return { isValid: true };
};

// Quantity validation
export const validateQuantity = (quantity: number): { isValid: boolean; error?: string } => {
  if (quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than 0' };
  }

  if (quantity > 999999) {
    return { isValid: false, error: 'Quantity is too large' };
  }

  return { isValid: true };
};