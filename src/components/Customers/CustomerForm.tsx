import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, User, Building } from 'lucide-react';
import { Customer, INDIAN_STATES } from '../../types';
import { validateGSTIN, validateEmail, validatePhone, validatePincode } from '../../utils/validation';
import { supabase } from '../../services/supabase';

interface CustomerFormProps {
  customer?: Customer;
  onSave: () => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    type: 'B2C',
    gstin: '',
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
    shippingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
    contact: {
      phone: '',
      email: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
      setSameAsBilling(!customer.shippingAddress || 
        JSON.stringify(customer.billingAddress) === JSON.stringify(customer.shippingAddress)
      );
    }
  }, [customer]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (formData.type === 'B2B' && formData.gstin) {
      const gstinValidation = validateGSTIN(formData.gstin);
      if (!gstinValidation.isValid) {
        newErrors.gstin = gstinValidation.error || '';
      }
    }

    // Billing address validation
    if (!formData.billingAddress?.line1?.trim()) {
      newErrors.billingLine1 = 'Billing address line 1 is required';
    }

    if (!formData.billingAddress?.city?.trim()) {
      newErrors.billingCity = 'Billing city is required';
    }

    if (!formData.billingAddress?.state) {
      newErrors.billingState = 'Billing state is required';
    }

    const billingPincodeValidation = validatePincode(formData.billingAddress?.pincode || '');
    if (!billingPincodeValidation.isValid) {
      newErrors.billingPincode = billingPincodeValidation.error || '';
    }

    // Shipping address validation (if different from billing)
    if (!sameAsBilling) {
      if (!formData.shippingAddress?.line1?.trim()) {
        newErrors.shippingLine1 = 'Shipping address line 1 is required';
      }

      if (!formData.shippingAddress?.city?.trim()) {
        newErrors.shippingCity = 'Shipping city is required';
      }

      if (!formData.shippingAddress?.state) {
        newErrors.shippingState = 'Shipping state is required';
      }

      const shippingPincodeValidation = validatePincode(formData.shippingAddress?.pincode || '');
      if (!shippingPincodeValidation.isValid) {
        newErrors.shippingPincode = shippingPincodeValidation.error || '';
      }
    }

    // Contact validation
    if (formData.contact?.phone) {
      const phoneValidation = validatePhone(formData.contact.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || '';
      }
    }

    if (formData.contact?.email) {
      const emailValidation = validateEmail(formData.contact.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error || '';
      }
    }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) throw new Error('User not authenticated');
      const customerData = {
        id: customer?.id || crypto.randomUUID(),
        name: formData.name,
        type: formData.type,
        gstin: formData.gstin,
        billing_address_line1: formData.billingAddress?.line1 || '',
        billing_address_line2: formData.billingAddress?.line2 || '',
        billing_city: formData.billingAddress?.city || '',
        billing_state: formData.billingAddress?.state || '',
        billing_pincode: formData.billingAddress?.pincode || '',
        shipping_address_line1: formData.shippingAddress?.line1 || '',
        shipping_address_line2: formData.shippingAddress?.line2 || '',
        shipping_city: formData.shippingAddress?.city || '',
        shipping_state: formData.shippingAddress?.state || '',
        shipping_pincode: formData.shippingAddress?.pincode || '',
        phone: formData.contact?.phone || '',
        email: formData.contact?.email || '',
        user_id: user.id,
        created_at: customer?.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabase.from('customers').upsert([customerData]);
      onSave();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('billingAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress!,
          [addressField]: value,
        },
      }));
      
      // If same as billing, update shipping address too
      if (sameAsBilling) {
        setFormData(prev => ({
          ...prev,
          shippingAddress: {
            ...prev.billingAddress!,
            [addressField]: value,
          },
        }));
      }
    } else if (field.startsWith('shippingAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress!,
          [addressField]: value,
        },
      }));
    } else if (field.startsWith('contact.')) {
      const contactField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact!,
          [contactField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (type: 'B2B' | 'B2C') => {
    setFormData(prev => ({
      ...prev,
      type,
      gstin: type === 'B2C' ? '' : prev.gstin,
    }));
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress! },
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={onCancel}
            className="mr-3 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Type */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Customer Type *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('B2C')}
                className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
                  formData.type === 'B2C'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5 mx-auto mb-1" />
                <div className="font-medium">B2C</div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('B2B')}
                className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
                  formData.type === 'B2B'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Building className="h-5 w-5 mx-auto mb-1" />
                <div className="font-medium">B2B</div>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter customer name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            {formData.type === 'B2B' && (
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={formData.gstin || ''}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.gstin ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
                {errors.gstin && (
                  <p className="mt-1 text-sm text-red-600">{errors.gstin}</p>
                )}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.contact?.phone || ''}
                  onChange={(e) => handleInputChange('contact.phone', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="9876543210"
                  maxLength={10}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact?.email || ''}
                  onChange={(e) => handleInputChange('contact.email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="customer@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Billing Address</h3>
            <div className="mb-2">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={formData.billingAddress?.line1 || ''}
                onChange={(e) => handleInputChange('billingAddress.line1', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.billingLine1 ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Building, Street"
              />
              {errors.billingLine1 && (
                <p className="mt-1 text-sm text-red-600">{errors.billingLine1}</p>
              )}
            </div>
            <div className="mb-2">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.billingAddress?.line2 || ''}
                onChange={(e) => handleInputChange('billingAddress.line2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Area, Landmark (Optional)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.billingAddress?.city || ''}
                  onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.billingCity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="City"
                />
                {errors.billingCity && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingCity}</p>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  State *
                </label>
                <select
                  value={formData.billingAddress?.state || ''}
                  onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.billingState ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select State</option>
                  {Object.keys(INDIAN_STATES).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.billingState && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingState}</p>
                )}
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.billingAddress?.pincode || ''}
                  onChange={(e) => handleInputChange('billingAddress.pincode', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.billingPincode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="400001"
                  maxLength={6}
                />
                {errors.billingPincode && (
                  <p className="mt-1 text-sm text-red-600">{errors.billingPincode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-semibold text-gray-900">Shipping Address</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => handleSameAsBillingChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Same as billing address</span>
              </label>
            </div>
            {!sameAsBilling && (
              <>
                <div className="mb-2">
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.line1 || ''}
                    onChange={(e) => handleInputChange('shippingAddress.line1', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.shippingLine1 ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Building, Street"
                  />
                  {errors.shippingLine1 && (
                    <p className="mt-1 text-sm text-red-600">{errors.shippingLine1}</p>
                  )}
                </div>
                <div className="mb-2">
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.shippingAddress?.line2 || ''}
                    onChange={(e) => handleInputChange('shippingAddress.line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Area, Landmark (Optional)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress?.city || ''}
                      onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.shippingCity ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="City"
                    />
                    {errors.shippingCity && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingCity}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <select
                      value={formData.shippingAddress?.state || ''}
                      onChange={(e) => handleInputChange('shippingAddress.state', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.shippingState ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select State</option>
                      {Object.keys(INDIAN_STATES).map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.shippingState && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingState}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={formData.shippingAddress?.pincode || ''}
                      onChange={(e) => handleInputChange('shippingAddress.pincode', e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.shippingPincode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="400001"
                      maxLength={6}
                    />
                    {errors.shippingPincode && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingPincode}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Saving...' : customer ? 'Update Customer' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;