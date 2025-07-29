import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Plus, Trash2, User, Calculator } from 'lucide-react';
import { InvoiceItem, Customer, Product, Company, Vehicle } from '../../types';
import { supabase } from '../../supabaseClient';
// Use local Invoice type override to fix date fields
type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
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
  status: 'CREDIT' | 'PAID'; // <-- Restrict to only these two
  createdAt: string;
  updatedAt: string;
  vehicle_id?: string; // <-- Add this line
};
import { db } from '../../services/database';
import { calculateInvoiceTotal, convertToWords, isInterState } from '../../utils/calculations';
import { validateQuantity, validateAmount } from '../../utils/validation';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSave: () => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0], // ISO string
    customerId: '',
    customerName: '',
    customerGstin: '',
    customerAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
    items: [],
    notes: '',
    status: 'CREDIT', // <-- Default to CREDIT
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    totalTaxableValue: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalAmount: 0,
  });
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [autoPrefix, setAutoPrefix] = useState('INV-');
  const [autoNumber, setAutoNumber] = useState(1001);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
      setInvoiceNumber(invoice.invoiceNumber);
      loadCustomerById(invoice.customerId);
      setSelectedVehicleId(invoice.vehicle_id || ''); // <-- ADD THIS LINE
    } else {
      generateInvoiceNumber();
      setSelectedVehicleId(''); // <-- Reset on new invoice
    }
  }, [invoice]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, company, selectedCustomer]);

  useEffect(() => {
    async function fetchCompanyInvoiceSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) return;
      const { data } = await supabase
        .from('companies')
        .select('invoice_prefix, last_invoice_number')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setAutoPrefix(data.invoice_prefix || 'INV-');
        setAutoNumber((data.last_invoice_number || 1000) + 1);
        setInvoiceNumber(`${data.invoice_prefix || 'INV-'}${(data.last_invoice_number || 1000) + 1}`);
      }
    }
    fetchCompanyInvoiceSettings();
  }, []);

  const loadInitialData = async () => {
    try {
      const [customerList, productList, companyData] = await Promise.all([
        db.getCustomers(),    // ✅ This calls the function
        db.getProducts(),     // ✅
        db.getCompany(),      // ✅
      ]);
      setCustomers(customerList);
      setProducts(productList);
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadCustomerById = async (customerId: string) => {
    try {
      const customer = await db.getCustomer(customerId);
      if (customer) {
        setSelectedCustomer(customer);
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      const invoiceNumber = await db.getNextInvoiceNumber();
      setFormData(prev => ({ ...prev, invoiceNumber }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  };

  const calculateTotals = () => {
    if (!formData.items || formData.items.length === 0 || !company) {
      setCalculations({
        subtotal: 0,
        totalTaxableValue: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalAmount: 0,
      });
      return;
    }

    const totals = calculateInvoiceTotal(
      formData.items,
      company.gstin,
      selectedCustomer?.gstin
    );
    setCalculations(totals);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerGstin: customer.gstin,
        customerAddress: customer.billingAddress,
      }));
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      productId: '',
      productName: '',
      hsnSacCode: '',
      quantity: 1,
      rate: 0,
      discount: 0,
      taxableValue: 0,
      gstRate: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: 0,
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== itemId) || [],
    }));
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setFormData(prev => {
      const items = (prev.items || []).map(item => {
        if (item.id !== itemId) return item;

        // Always create a new object for the updated item
        const updatedItem = { ...item, [field]: value };

        // If product is selected, update related fields
        if (field === 'productId' && value) {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.hsnSacCode = product.hsnSacCode;
            updatedItem.rate = product.price;
            updatedItem.gstRate = product.gstRate;
          }
        }

        // Ensure numbers are numbers
        updatedItem.quantity = Number(updatedItem.quantity) || 0;
        updatedItem.rate = Number(updatedItem.rate) || 0;
        updatedItem.discount = Number(updatedItem.discount) || 0;
        updatedItem.gstRate = Number(updatedItem.gstRate) || 0;

        // Recalculate item totals
        const itemTotal = updatedItem.quantity * updatedItem.rate;
        const discount = updatedItem.discount || 0;
        updatedItem.taxableValue = itemTotal - discount;

        // Calculate GST
        const gstAmount = (updatedItem.taxableValue * updatedItem.gstRate) / 100;
        const isInterStateTx = company && selectedCustomer ?
          isInterState(company.gstin, selectedCustomer.gstin) : false;

        if (isInterStateTx) {
          updatedItem.igst = gstAmount;
          updatedItem.cgst = 0;
          updatedItem.sgst = 0;
        } else {
          updatedItem.cgst = gstAmount / 2;
          updatedItem.sgst = gstAmount / 2;
          updatedItem.igst = 0;
        }

        updatedItem.totalAmount = updatedItem.taxableValue + gstAmount;

        return updatedItem;
      });

      return { ...prev, items };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customer = 'Please select a customer';
    }

    if (!formData.items || formData.items.length === 0) {
      newErrors.items = 'Please add at least one item';
    }

    formData.items?.forEach((item, index) => {
      if (!item.productName.trim()) {
        newErrors[`item_${index}_name`] = 'Product name is required';
      }
      
      const qtyValidation = validateQuantity(item.quantity);
      if (!qtyValidation.isValid) {
        newErrors[`item_${index}_quantity`] = qtyValidation.error || '';
      }
      
      const rateValidation = validateAmount(item.rate);
      if (!rateValidation.isValid) {
        newErrors[`item_${index}_rate`] = rateValidation.error || '';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) throw new Error('User not authenticated');

      // Explicitly cast status to 'CREDIT' | 'PAID'
      const invoiceData: Invoice & { user_id: string; vehicle_id?: string } = {
        ...{
          id: invoice?.id || crypto.randomUUID(),
          invoiceNumber: formData.invoiceNumber!,
          date: formData.date || new Date().toISOString().split('T')[0],
          customerId: formData.customerId!,
          customerName: formData.customerName!,
          customerGstin: formData.customerGstin,
          customerAddress: formData.customerAddress!,
          items: formData.items!,
          subtotal: calculations.subtotal,
          totalTaxableValue: calculations.totalTaxableValue,
          totalCgst: calculations.totalCgst,
          totalSgst: calculations.totalSgst,
          totalIgst: calculations.totalIgst,
          totalAmount: calculations.totalAmount,
          amountInWords: convertToWords(calculations.totalAmount),
          notes: formData.notes,
          status: (formData.status as 'CREDIT' | 'PAID'), // <-- Fix type here
          createdAt: invoice?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        user_id: user.id,
        vehicle_id: selectedVehicleId ? selectedVehicleId : undefined,
      };

      // Save invoice data to the database
      await db.saveInvoice(invoiceData);
      
      // After successfully saving the invoice:
      const match = invoiceNumber.match(/^([A-Za-z\-]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2], 10);
        await supabase
          .from('companies')
          .update({
            invoice_prefix: prefix,
            last_invoice_number: number
          })
          .eq('user_id', user.id);
      }

      onSave();
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await db.getVehicles();
        setVehicles(data);
      } catch (e) {
        setVehicles([]);
      }
    };
    loadVehicles();
  }, []);

  return (
    <div className="max-w-2xl w-full mx-auto px-2 sm:px-0 animate-fade-in">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onCancel}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {invoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CREDIT">Credit</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                value={invoiceNumber}
                onChange={e => {
                  setInvoiceNumber(e.target.value);
                  setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }));
                }}
                required
                placeholder={`${autoPrefix}${autoNumber}`}
              />
              <small className="text-gray-500">
                Leave as is for auto-increment, or enter your own format.
              </small>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                value={formData.customerId || ''}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customer ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.gstin ? `(${customer.gstin})` : ''}
                  </option>
                ))}
              </select>
              {errors.customer && (
                <p className="mt-1 text-sm text-red-600">{errors.customer}</p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          {selectedCustomer && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-gray-600">
                    {selectedCustomer.billingAddress.line1}
                    {selectedCustomer.billingAddress.line2 && `, ${selectedCustomer.billingAddress.line2}`}
                  </p>
                  <p className="text-gray-600">
                    {selectedCustomer.billingAddress.city}, {selectedCustomer.billingAddress.state} - {selectedCustomer.billingAddress.pincode}
                  </p>
                </div>
                <div>
                  {selectedCustomer.gstin && (
                    <p><span className="font-medium">GSTIN:</span> {selectedCustomer.gstin}</p>
                  )}
                  {selectedCustomer.contact.phone && (
                    <p><span className="font-medium">Phone:</span> {selectedCustomer.contact.phone}</p>
                  )}
                  {selectedCustomer.contact.email && (
                    <p><span className="font-medium">Email:</span> {selectedCustomer.contact.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Details */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Number
            </label>
            <select
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_number}</option>
              ))}
            </select>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {errors.items && (
              <p className="mb-4 text-sm text-red-600">{errors.items}</p>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HSN/SAC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GST%</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.items?.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            errors[`item_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        {!item.productId && (
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                            placeholder="Enter product name"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.hsnSacCode}
                          onChange={(e) => updateItem(item.id, 'hsnSacCode', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                          placeholder="HSN"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          className={`w-20 px-2 py-1 border rounded text-sm ${
                            errors[`item_${index}_quantity`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                          className={`w-24 px-2 py-1 border rounded text-sm ${
                            errors[`item_${index}_rate`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount || 0}
                          onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItem(item.id, 'gstRate', Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {[0, 5, 12, 18, 28].map(rate => (
                            <option key={rate} value={rate}>{rate}%</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ₹{item.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!formData.items || formData.items.length === 0) && (
              <div className="text-center py-8 border border-gray-200 rounded-lg">
                <Calculator className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No items added yet. Click "Add Item" to get started.</p>
              </div>
            )}
          </div>

          {/* Calculations */}
          {formData.items && formData.items.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculations.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span>₹{calculations.totalTaxableValue.toFixed(2)}</span>
                  </div>
                  {calculations.totalCgst > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>CGST:</span>
                        <span>₹{calculations.totalCgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST:</span>
                        <span>₹{calculations.totalSgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {calculations.totalIgst > 0 && (
                    <div className="flex justify-between">
                      <span>IGST:</span>
                      <span>₹{calculations.totalIgst.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{calculations.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Amount in Words:</p>
                  <p className="text-sm font-medium bg-white p-3 rounded border">
                    {convertToWords(calculations.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or terms (optional)"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Save Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;