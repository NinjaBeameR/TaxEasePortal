import React, { useState, useEffect } from 'react';
import { FileText, Users, Package, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { db } from '../../services/database';
import { Invoice } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Replace with your actual download logic (PDF, print, etc.)
    window.open(`/invoices/download/${invoice.id}`, '_blank');
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, icon: Icon, color, onClick }) => (
    <div
      className={`bg-white rounded-xl shadow p-4 flex items-center gap-4 mb-2 h-24 ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className={`flex-shrink-0 p-2 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <div className="font-semibold text-base text-gray-700">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-4 sm:mb-0">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Monthly Stats & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow p-4 mb-2">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-base font-semibold text-gray-900">This Month</h3>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
            <p className="text-sm text-gray-600">Revenue this month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-2">
          <div className="flex items-center mb-2">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onNavigate('invoices', { action: 'create' })}
              className="w-full text-left px-3 py-2 text-sm text-blue-700 font-semibold hover:bg-blue-50 rounded-md transition-colors"
            >
              Create New Invoice
            </button>
            <button
              onClick={() => onNavigate('customers', { action: 'create' })}
              className="w-full text-left px-3 py-2 text-sm text-green-700 font-semibold hover:bg-green-50 rounded-md transition-colors"
            >
              Add New Customer
            </button>
            <button
              onClick={() => onNavigate('products', { action: 'create' })}
              className="w-full text-left px-3 py-2 text-sm text-purple-700 font-semibold hover:bg-purple-50 rounded-md transition-colors"
            >
              Add New Product
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Recent Invoices</h3>
          <button
            onClick={() => navigate('/invoices/new')}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            <FileText className="h-5 w-5" />
            New Invoice
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {stats.recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">📄</span>
                      No invoices found. Create your first invoice to get started.
                    </div>
                  </td>
                </tr>
              ) : (
                stats.recentInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-blue-50 cursor-pointer transition"
                    onClick={() => navigate(`/invoices/view`, { state: { invoice } })}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-semibold text-blue-700">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {invoice.customerName}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
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
                    <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                      <button
                        className="text-green-600 hover:underline"
                        onClick={e => {
                          e.stopPropagation(); // Prevent row click when downloading
                          handleDownloadInvoice(invoice);
                        }}
                        title="Download Invoice"
                      >
                        Download
                      </button>
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