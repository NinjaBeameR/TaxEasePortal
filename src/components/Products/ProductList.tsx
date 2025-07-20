import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Tag } from 'lucide-react';
import { Product, GST_RATES } from '../../types';
import { db } from '../../services/database';
import { formatCurrency } from '../../utils/calculations';

interface ProductListProps {
  onEdit: (product: Product) => void;
  onCreate: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEdit, onCreate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GOODS' | 'SERVICES'>('ALL');
  const [filterGstRate, setFilterGstRate] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, filterType, filterGstRate]);

  const loadProducts = async () => {
    try {
      const productList = await db.getProducts();
      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.hsnSacCode.includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(product => product.type === filterType);
    }

    // Filter by GST rate
    if (filterGstRate !== 'ALL') {
      filtered = filtered.filter(product => product.gstRate === filterGstRate);
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await db.deleteProduct(product.id);
        setProducts(prev => prev.filter(p => p.id !== product.id));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
        <button
          onClick={onCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'GOODS', 'SERVICES'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type}
              </button>
            ))}
            
            <select
              value={filterGstRate}
              onChange={(e) => setFilterGstRate(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All GST Rates</option>
              {GST_RATES.map(rate => (
                <option key={rate} value={rate}>{rate}% GST</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'ALL' || filterGstRate !== 'ALL'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first product or service.'}
            </p>
            {!searchTerm && filterType === 'ALL' && filterGstRate === 'ALL' && (
              <div className="mt-6">
                <button
                  onClick={onCreate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product/Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HSN/SAC Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          product.type === 'GOODS' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {product.type === 'GOODS' ? (
                            <Package className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Tag className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {product.hsnSacCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        product.type === 'GOODS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.gstRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.unitOfMeasurement}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredProducts.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      )}
    </div>
  );
};

export default ProductList;