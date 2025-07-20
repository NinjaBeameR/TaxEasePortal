import React, { useState, useEffect } from 'react';
import { FileText, Users, Package, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { db } from '../../services/database';
import { Invoice, Customer, Product } from '../../types';
import { formatCurrency } from '../../utils/calculations';

interface DashboardStats {
  totalInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentInvoices: Invoice[];
}

interface DashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [invoices, customers, products] = await Promise.all([
        db.getInvoices(),
        db.getCustomers(),
        db.getProducts(),
      ]);

      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.date);
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const recentInvoices = invoices
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setStats({
        totalInvoices: invoices.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        totalRevenue,
        monthlyRevenue,
        recentInvoices,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, icon: Icon, color, onClick }) => (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => onNavigate('invoices', { action: 'create' })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={FileText}
          color="bg-blue-500"
          onClick={() => onNavigate('invoices')}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          color="bg-green-500"
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-purple-500"
          onClick={() => onNavigate('products')}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={IndianRupee}
          color="bg-yellow-500"
        />
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
            <p className="text-sm text-gray-600">Revenue this month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => onNavigate('invoices', { action: 'create' })}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Create New Invoice
            </button>
            <button
              onClick={() => onNavigate('customers', { action: 'create' })}
              className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
            >
              Add New Customer
            </button>
            <button
              onClick={() => onNavigate('products', { action: 'create' })}
              className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
            >
              Add New Product
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No invoices found. Create your first invoice to get started.
                  </td>
                </tr>
              ) : (
                stats.recentInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onNavigate('invoices', { action: 'view', invoice })}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'SENT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;