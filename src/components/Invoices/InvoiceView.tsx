import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer, Mail, Edit } from 'lucide-react';
import { Invoice, Company } from '../../types';
import { db } from '../../services/database';
import { formatIndianNumber } from '../../utils/calculations';

interface InvoiceViewProps {
  invoice: Invoice;
  onEdit: () => void;
  onBack: () => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, onEdit, onBack }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    try {
      const companyData = await db.getCompany();
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // PDF generation would be implemented here
    alert('PDF download functionality would be implemented here using jsPDF');
  };

  const handleSendEmail = () => {
    // Email functionality would be implemented here
    alert('Email functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 print:hidden">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h2>
            <span className={`ml-4 px-3 py-1 text-sm font-semibold rounded-full ${
              invoice.status === 'PAID'
                ? 'bg-green-100 text-green-800'
                : invoice.status === 'SENT'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {invoice.status}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleSendEmail}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Document */}
      <div id="invoice-print-area" className="bg-white rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none">
        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                {company && (
                  <>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {company.businessName}
                    </h1>
                    <div className="text-gray-600 space-y-1">
                      <p>{company.address.line1}</p>
                      {company.address.line2 && <p>{company.address.line2}</p>}
                      <p>{company.address.city}, {company.address.state} - {company.address.pincode}</p>
                      <p>GSTIN: {company.gstin}</p>
                      {company.contact.phone && <p>Phone: {company.contact.phone}</p>}
                      {company.contact.email && <p>Email: {company.contact.email}</p>}
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">TAX INVOICE</h2>
                <div className="text-gray-600">
                  <p><span className="font-medium">Invoice No:</span> {invoice.invoiceNumber}</p>
                  <p><span className="font-medium">Date:</span> {new Date(invoice.date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
              <div className="text-gray-700 space-y-1">
                <p className="font-medium text-lg">{invoice.customerName}</p>
                <p>{invoice.customerAddress.line1}</p>
                {invoice.customerAddress.line2 && <p>{invoice.customerAddress.line2}</p>}
                <p>{invoice.customerAddress.city}, {invoice.customerAddress.state} - {invoice.customerAddress.pincode}</p>
                {invoice.customerGstin && <p>GSTIN: {invoice.customerGstin}</p>}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details:</h3>
              <div className="text-gray-700 space-y-1">
                <p><span className="font-medium">Invoice Number:</span> {invoice.invoiceNumber}</p>
                <p><span className="font-medium">Invoice Date:</span> {new Date(invoice.date).toLocaleDateString('en-IN')}</p>
                <p><span className="font-medium">Status:</span> {invoice.status}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">S.No</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">HSN/SAC</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Qty</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Rate</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Amount</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Discount</th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Taxable Value</th>
                  {invoice.totalCgst > 0 && (
                    <>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">CGST</th>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">SGST</th>
                    </>
                  )}
                  {invoice.totalIgst > 0 && (
                    <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">IGST</th>
                  )}
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">{item.productName}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm font-mono">{item.hsnSacCode}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">{formatIndianNumber(item.quantity)}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">₹{formatIndianNumber(item.rate)}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">₹{formatIndianNumber(item.quantity * item.rate)}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">₹{formatIndianNumber(item.discount || 0)}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">₹{formatIndianNumber(item.taxableValue)}</td>
                    {invoice.totalCgst > 0 && (
                      <>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right">₹{formatIndianNumber(item.cgst || 0)}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right">₹{formatIndianNumber(item.sgst || 0)}</td>
                      </>
                    )}
                    {invoice.totalIgst > 0 && (
                      <td className="border border-gray-300 px-4 py-3 text-sm text-right">₹{formatIndianNumber(item.igst || 0)}</td>
                    )}
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium">₹{formatIndianNumber(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Amount in Words:</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded border font-medium">
                {invoice.amountInWords}
              </p>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-2 text-right font-medium">Subtotal:</td>
                    <td className="py-2 text-right pl-4">₹{formatIndianNumber(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-right font-medium">Taxable Amount:</td>
                    <td className="py-2 text-right pl-4">₹{formatIndianNumber(invoice.totalTaxableValue)}</td>
                  </tr>
                  {invoice.totalCgst > 0 && (
                    <>
                      <tr>
                        <td className="py-2 text-right font-medium">CGST:</td>
                        <td className="py-2 text-right pl-4">₹{formatIndianNumber(invoice.totalCgst)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-right font-medium">SGST:</td>
                        <td className="py-2 text-right pl-4">₹{formatIndianNumber(invoice.totalSgst)}</td>
                      </tr>
                    </>
                  )}
                  {invoice.totalIgst > 0 && (
                    <tr>
                      <td className="py-2 text-right font-medium">IGST:</td>
                      <td className="py-2 text-right pl-4">₹{formatIndianNumber(invoice.totalIgst)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-300">
                    <td className="py-3 text-right font-bold text-lg">Total Amount:</td>
                    <td className="py-3 text-right pl-4 font-bold text-lg">₹{formatIndianNumber(invoice.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes:</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded border">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Payment is due within 30 days of invoice date</li>
                  <li>• Late payments may incur additional charges</li>
                  <li>• Goods once sold will not be taken back</li>
                </ul>
              </div>
              <div className="text-right">
                <div className="mb-16">
                  <p className="text-sm text-gray-600 mb-2">For {company?.businessName}</p>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-sm font-medium">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;