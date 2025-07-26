import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, FileText, Download, Calendar, ArrowRight } from 'lucide-react';
import { Invoice } from '../../types';
import { db } from '../../services/database';
import { formatCurrency } from '../../utils/calculations';
import InvoiceView from './InvoiceView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface InvoiceListProps {
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onCreate: () => void;
  initialAction?: { action: string; invoice?: Invoice };
}

// Animated number for summary cards
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    let increment = end / 30;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, 15);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
};

const InvoiceList: React.FC<InvoiceListProps> = ({ onView, onEdit, onCreate, initialAction }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'SENT' | 'PAID'>('ALL');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);

  // For PDF download
  const [showHiddenInvoice, setShowHiddenInvoice] = useState(false);
  const [invoiceToDownload, setInvoiceToDownload] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (initialAction?.action === 'create') {
      onCreate();
    } else if (initialAction?.action === 'view' && initialAction.invoice) {
      onView(initialAction.invoice);
    }
  }, [initialAction, onCreate, onView]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, filterStatus, dateRange]);

  const loadInvoices = async () => {
    try {
      const invoiceList = await db.getInvoices();
      const sortedInvoices = invoiceList.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setInvoices(sortedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerGstin?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(invoice => invoice.status === filterStatus);
    }
    if (dateRange.from) {
      filtered = filtered.filter(invoice =>
        new Date(invoice.date) >= new Date(dateRange.from)
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(invoice =>
        new Date(invoice.date) <= new Date(dateRange.to)
      );
    }
    setFilteredInvoices(filtered);
  };

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      setLoading(true);
      await db.deleteInvoice(invoiceId);
      await loadInvoices();
    } catch (error) {
      alert('Failed to delete invoice.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (invoice: Invoice) => {
    try {
      const fullInvoice = await db.getInvoice(invoice.id);
      if (fullInvoice) {
        onEdit(fullInvoice);
      }
    } catch (error) {
      console.error('Error loading invoice for edit:', error);
      alert('Could not load invoice details for editing.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SENT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // PDF download handler
  const handleDownloadPDF = async (invoice: Invoice) => {
    const fullInvoice = await db.getInvoice(invoice.id);
    setInvoiceToDownload(fullInvoice || invoice);
    setShowHiddenInvoice(true);

    setTimeout(() => {
      const invoiceArea = document.getElementById('invoice-print-area');
      if (invoiceArea) {
        html2canvas(invoiceArea, { scale: 2 }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgWidth = pageWidth - 40;
          const imgHeight = canvas.height * (imgWidth / canvas.width);
          pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
          pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
          setShowHiddenInvoice(false);
          setInvoiceToDownload(null);
        });
      } else {
        alert('Invoice area not found!');
        setShowHiddenInvoice(false);
        setInvoiceToDownload(null);
      }
    }, 500);
  };

  // Excel export handler
  const handleExportExcel = () => {
    // Prepare data: one row per invoice
    const data = filteredInvoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Date': new Date(inv.date).toLocaleDateString('en-IN'),
      'Customer': inv.customerName,
      'GSTIN': inv.customerGstin || '',
      'Amount': inv.totalAmount,
      'Status': inv.status,
    }));

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

    // Download
    XLSX.writeFile(wb, 'All_Invoices.xlsx');
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
        <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-green-700 transition active:scale-95"
            title="Download all invoices as Excel"
          >
            <Download className="h-5 w-5" />
            Export Excel
          </button>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              placeholder="From date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              placeholder="To date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'ALL' || dateRange.from || dateRange.to
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first invoice.'}
            </p>
            {!searchTerm && filterStatus === 'ALL' && !dateRange.from && !dateRange.to && (
              <div className="mt-6">
                <button
                  onClick={onCreate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Invoice
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="group hover:bg-blue-50 hover:shadow cursor-pointer transition-all"
                    tabIndex={0}
                    role="button"
                    onClick={() => onView(invoice)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2 font-semibold text-blue-700">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onView(invoice);
                        }}
                        className="text-blue-700 hover:underline flex items-center gap-2 focus:outline-none"
                        style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
                        title="View invoice"
                      >
                        {invoice.invoiceNumber}
                        <ArrowRight className="h-4 w-4 text-blue-300" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.customerName}</div>
                      {invoice.customerGstin && (
                        <div className="text-xs text-gray-500 font-mono">{invoice.customerGstin}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onView(invoice);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 active:scale-95"
                          title="View invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 active:scale-95"
                          title="Edit invoice"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 active:scale-95"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 active:scale-95"
                          title="Delete invoice"
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

      {/* Hidden InvoiceView for PDF generation */}
      {showHiddenInvoice && invoiceToDownload && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
          <InvoiceView invoice={invoiceToDownload} />
        </div>
      )}

      {/* Summary */}
      {filteredInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm animate-fade-in">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow hover:shadow-lg transition">
            <div className="text-gray-600">Total Invoices</div>
            <div className="text-xl font-semibold text-gray-900">
              <AnimatedNumber value={filteredInvoices.length} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow hover:shadow-lg transition">
            <div className="text-gray-600">Total Amount</div>
            <div className="text-xl font-semibold text-gray-900">
              <AnimatedNumber value={filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow hover:shadow-lg transition">
            <div className="text-gray-600">Paid Amount</div>
            <div className="text-xl font-semibold text-green-600">
              <AnimatedNumber value={filteredInvoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0)} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow hover:shadow-lg transition">
            <div className="text-gray-600">Pending Amount</div>
            <div className="text-xl font-semibold text-yellow-600">
              <AnimatedNumber value={filteredInvoices.filter(inv => inv.status !== 'PAID').reduce((sum, inv) => sum + inv.totalAmount, 0)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;