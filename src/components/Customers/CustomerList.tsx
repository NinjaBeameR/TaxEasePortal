import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Building, ArrowRight } from 'lucide-react';
import { Customer } from '../../types';
import { db } from '../../services/database';

interface CustomerListProps {
  onEdit: (customer: Customer) => void;
  onCreate: () => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ onEdit, onCreate }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterType]);

  const loadCustomers = async () => {
    try {
      const customerList = await db.getCustomers();
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.gstin && customer.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        customer.contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact.phone?.includes(searchTerm)
      );
    }
    if (filterType !== 'ALL') {
      filtered = filtered.filter(customer => customer.type === filterType);
    }
    setFilteredCustomers(filtered);
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await db.deleteCustomer(customer.id);
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer. Please try again.');
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            {(['ALL', 'B2B', 'B2C'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'ALL' ? 'All Customers' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'ALL'
                ? 'Try adjusting your search or filter.'
                : 'Get started by adding your first customer.'}
            </p>
            {!searchTerm && filterType === 'ALL' && (
              <div className="mt-6">
                <button
                  onClick={onCreate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Customer
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GSTIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="group hover:bg-blue-50 hover:shadow cursor-pointer transition-all dashboard-row"
                    tabIndex={0}
                    role="button"
                    onClick={() => onEdit(customer)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2 font-semibold text-blue-700">
                      <span>
                        {customer.name}
                      </span>
                      <ArrowRight className="h-4 w-4 text-blue-300 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.type === 'B2B'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.gstin || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {customer.contact.phone && (
                          <div>{customer.contact.phone}</div>
                        )}
                        {customer.contact.email && (
                          <div className="text-xs">{customer.contact.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.billingAddress.city}, {customer.billingAddress.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={e => { e.stopPropagation(); onEdit(customer); }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 active:scale-95"
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(customer); }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 active:scale-95"
                          title="Delete customer"
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
      {filteredCustomers.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )}
    </div>
  );
};

export default CustomerList;