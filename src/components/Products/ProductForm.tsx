import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Package, Tag } from 'lucide-react';
import { Product, GST_RATES } from '../../types';
import { validateHSNSACCode, validateAmount } from '../../utils/validation';
import { db } from '../../services/database';

interface ProductFormProps {
  product?: Product;
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    hsnSacCode: '',
    gstRate: 18,
    unitOfMeasurement: 'PCS',
    price: 0,
    type: 'GOODS',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const unitOptions = [
    'PCS', 'KG', 'GRAM', 'LITRE', 'METER', 'FEET', 'INCH', 'SQM', 'SQF',
    'HOUR', 'DAY', 'MONTH', 'YEAR', 'BOX', 'PACKET', 'BOTTLE', 'BAG'
  ];

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    const hsnValidation = validateHSNSACCode(formData.hsnSacCode || '');
    if (!hsnValidation.isValid) {
      newErrors.hsnSacCode = hsnValidation.error || '';
    }

    const priceValidation = validateAmount(formData.price || 0);
    if (!priceValidation.isValid) {
      newErrors.price = priceValidation.error || '';
    }

    if (!formData.unitOfMeasurement?.trim()) {
      newErrors.unitOfMeasurement = 'Unit of measurement is required';
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
      const productData: Product = {
        id: product?.id || crypto.randomUUID(),
        name: formData.name!,
        description: formData.description,
        hsnSacCode: formData.hsnSacCode!,
        gstRate: formData.gstRate!,
        unitOfMeasurement: formData.unitOfMeasurement!,
        price: formData.price!,
        type: formData.type!,
        createdAt: product?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await db.saveProduct(productData);
      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

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
                {product ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type *
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleInputChange('type', 'GOODS')}
                className={`flex-1 p-4 border rounded-lg text-center transition-colors ${
                  formData.type === 'GOODS'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Package className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Goods</div>
                <div className="text-xs text-gray-500">Physical products</div>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('type', 'SERVICES')}
                className={`flex-1 p-4 border rounded-lg text-center transition-colors ${
                  formData.type === 'SERVICES'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Tag className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Services</div>
                <div className="text-xs text-gray-500">Service offerings</div>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product/Service Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter product or service name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter product description (optional)"
              />
            </div>
          </div>

          {/* HSN/SAC Code and GST Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HSN/SAC Code *
              </label>
              <input
                type="text"
                value={formData.hsnSacCode || ''}
                onChange={(e) => handleInputChange('hsnSacCode', e.target.value.replace(/\D/g, ''))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono ${
                  errors.hsnSacCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1234"
                maxLength={8}
              />
              {errors.hsnSacCode && (
                <p className="mt-1 text-sm text-red-600">{errors.hsnSacCode}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.type === 'GOODS' ? 'HSN Code (4-8 digits)' : 'SAC Code (4-8 digits)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Rate *
              </label>
              <select
                value={formData.gstRate || 18}
                onChange={(e) => handleInputChange('gstRate', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {GST_RATES.map(rate => (
                  <option key={rate} value={rate}>{rate}% GST</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measurement *
              </label>
              <select
                value={formData.unitOfMeasurement || 'PCS'}
                onChange={(e) => handleInputChange('unitOfMeasurement', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.unitOfMeasurement ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {unitOptions.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              {errors.unitOfMeasurement && (
                <p className="mt-1 text-sm text-red-600">{errors.unitOfMeasurement}</p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Saving...' : product ? 'Update Product' : 'Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;