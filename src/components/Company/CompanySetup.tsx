import React, { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';
import { Company, INDIAN_STATES } from '../../types';
import { validateGSTIN, validateEmail, validatePhone, validatePincode } from '../../utils/validation';
import { supabase } from '../../services/supabase';

interface CompanySetupProps {
  onComplete: () => void;
}

const CompanySetup: React.FC<CompanySetupProps> = ({ onComplete }) => {
  const [company, setCompany] = useState<Partial<Company>>({
    businessName: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
    gstin: '',
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    logo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadExistingCompany();
  }, []);

  const loadExistingCompany = async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      if (error) {
        console.error('Error loading company:', error);
        return;
      }
      if (data && data.length > 0) {
        setCompany({
          id: data[0].id,
          businessName: data[0].business_name,
          address: {
            line1: data[0].address_line1,
            line2: data[0].address_line2,
            city: data[0].city,
            state: data[0].state,
            pincode: data[0].pincode,
          },
          gstin: data[0].gstin,
          contact: {
            phone: data[0].phone,
            email: data[0].email,
            website: data[0].website,
          },
          logo: data[0].logo,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at,
        });
        setIsEdit(true);
      } else {
        setIsEdit(false);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!company.businessName?.trim()) newErrors.businessName = 'Business name is required';
    if (!company.address?.line1?.trim()) newErrors.line1 = 'Address Line 1 is required';
    if (!company.address?.city?.trim()) newErrors.city = 'City is required';
    if (!company.address?.state) newErrors.state = 'State is required';
    const pincodeValidation = validatePincode(company.address?.pincode || '');
    if (!pincodeValidation.isValid) newErrors.pincode = pincodeValidation.error || '';
    const gstinValidation = validateGSTIN(company.gstin || '');
    if (!gstinValidation.isValid) newErrors.gstin = gstinValidation.error || '';
    const phoneValidation = validatePhone(company.contact?.phone || '');
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.error || '';
    const emailValidation = validateEmail(company.contact?.email || '');
    if (!emailValidation.isValid) newErrors.email = emailValidation.error || '';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) {
        setErrors({ submit: 'User not authenticated.' });
        setLoading(false);
        return;
      }
      const companyData = {
        business_name: company.businessName,
        address_line1: company.address?.line1 || '',
        address_line2: company.address?.line2 || '',
        city: company.address?.city || '',
        state: company.address?.state || '',
        pincode: company.address?.pincode || '',
        gstin: company.gstin || '',
        phone: company.contact?.phone || '',
        email: company.contact?.email || '',
        website: company.contact?.website || '',
        logo: company.logo || '',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('companies').upsert([companyData], { onConflict: 'user_id' });
      if (error) {
        setErrors({ submit: error.message || JSON.stringify(error) });
        setLoading(false);
        return;
      }
      onComplete();
    } catch (error) {
      setErrors({ submit: 'Unexpected error saving company.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setCompany(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value,
        },
      }));
    } else if (field.startsWith('contact.')) {
      const contactField = field.split('.')[1];
      setCompany(prev => ({
        ...prev,
        contact: {
          ...prev.contact!,
          [contactField]: value,
        },
      }));
    } else {
      setCompany(prev => ({
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8 max-w-xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isEdit ? 'Edit Company Details' : 'Company Setup'}
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {isEdit ? 'Update your company information' : 'Set up your company details for GST billing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Business Name */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={company.businessName || ''}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.businessName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your business name"
            />
            {errors.businessName && (
              <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
            )}
          </div>

          {/* GSTIN */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              GSTIN *
            </label>
            <input
              type="text"
              value={company.gstin || ''}
              onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
              className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.gstin ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
            />
            {errors.gstin && (
              <p className="mt-1 text-sm text-red-600">{errors.gstin}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              15-character GSTIN (e.g., 22AAAAA0000A1Z5)
            </p>
          </div>

          {/* Address */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900">Business Address</h3>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={company.address?.line1 || ''}
                onChange={(e) => handleInputChange('address.line1', e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.line1 ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Building, Street"
              />
              {errors.line1 && (
                <p className="mt-1 text-sm text-red-600">{errors.line1}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={company.address?.line2 || ''}
                onChange={(e) => handleInputChange('address.line2', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Area, Landmark (Optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={company.address?.city || ''}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="City"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  State *
                </label>
                <select
                  value={company.address?.state || ''}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.state ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select State</option>
                  {Object.keys(INDIAN_STATES).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={company.address?.pincode || ''}
                  onChange={(e) => handleInputChange('address.pincode', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.pincode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="400001"
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={company.contact?.phone || ''}
                  onChange={(e) => handleInputChange('contact.phone', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
                <label className="block text-gray-700 font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={company.contact?.email || ''}
                  onChange={(e) => handleInputChange('contact.email', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="business@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Website
              </label>
              <input
                type="url"
                value={company.contact?.website || ''}
                onChange={(e) => handleInputChange('contact.website', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.example.com (Optional)"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Saving...' : isEdit ? 'Update Company' : 'Save Company'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySetup;