import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowLeft, Download, Printer, Edit, Eye } from 'lucide-react';
import { Invoice, Company, Vehicle } from '../../types';
import { db } from '../../services/database';
import { printService } from '../../services/printService';
import { formatIndianNumber } from '../../utils/calculations';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FileSpreadsheet } from 'lucide-react';

// Add this prop to InvoiceView:
interface InvoiceViewProps {
  invoice?: Invoice;
  setInvoiceToEdit?: (invoice: Invoice) => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice: propInvoice, setInvoiceToEdit }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoice = propInvoice ?? (location.state?.invoice as Invoice | undefined);

  // Redirect if invoice is missing
  if (!invoice) {
    return <Navigate to="/invoices" replace />;
  }

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');

  useEffect(() => {
    loadCompany();
  }, []);

  useEffect(() => {
    const fetchVehicle = async () => {
      if (invoice.vehicle_id) {
        try {
          const vehicle = await db.getVehicleById(invoice.vehicle_id);
          setVehicleNumber(vehicle?.vehicle_number || '');
        } catch {
          setVehicleNumber('');
        }
      }
    };
    fetchVehicle();
  }, [invoice.vehicle_id]);

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

  // Enhanced print handlers with improved UX and error handling
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState<boolean | null>(null);

  const handlePrintDirect = async () => {
    if (isPrinting) return; // Prevent multiple simultaneous print requests
    
    setIsPrinting(true);
    setPrintSuccess(null);
    
    try {
      console.log('🖨️ Enhanced direct print requested');
      const success = await printService.printDirect('invoice-print-area');
      
      setPrintSuccess(success);
      
      if (success) {
        // Brief success feedback that auto-disappears
        setTimeout(() => setPrintSuccess(null), 3000);
      } else {
        // Show user-friendly error message
        setTimeout(() => setPrintSuccess(null), 5000);
      }
    } catch (error) {
      console.error('Print error:', error);
      setPrintSuccess(false);
      setTimeout(() => setPrintSuccess(null), 5000);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintPreview = async () => {
    if (isPrinting) return; // Prevent interference with direct print
    
    try {
      console.log('👁️ Print preview requested');
      const success = await printService.printWithPreview('invoice-print-area');
      if (!success) {
        alert('Print preview failed. Please check your browser settings and try again.');
      }
    } catch (error) {
      console.error('Print preview error:', error);
      alert('Unable to open print preview. Please check your browser settings or try the direct print option.');
    }
  };

  // Legacy print handler (fallback)
  const handlePrint = () => {
    console.log('📄 Legacy print fallback');
    window.print();
  };

  const handleDownloadPDF = () => {
    const invoiceArea = document.getElementById('invoice-print-area');
    if (!invoiceArea) {
      alert('Invoice area not found!');
      return;
    }
    html2canvas(invoiceArea, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      // Calculate image dimensions to fit A4
      const imgWidth = pageWidth - 40;
      const imgHeight = canvas.height * (imgWidth / canvas.width);
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    });
  };

  const handleDownloadExcel = () => {
    if (!invoice) return;

    // Header info
    const details = [
      ['Invoice Number', invoice.invoiceNumber],
      ['Date', new Date(invoice.date).toLocaleDateString('en-IN')],
      ['Customer', invoice.customerName],
      ['GSTIN', invoice.customerGstin || ''],
      ['Status', invoice.status],
      ['Total Amount', invoice.totalAmount],
      [''],
    ];

    // Table header
    const itemsHeader = [
      'S.No',
      'Description',
      'HSN/SAC',
      'Qty',
      'Rate',
      'Amount',
      'Discount',
      'Taxable Value',
      ...(invoice.totalCgst > 0 ? ['CGST', 'SGST'] : []),
      ...(invoice.totalIgst > 0 ? ['IGST'] : []),
      'Total',
    ];

    // Table rows
    const items = invoice.items.map((item, idx) => [
      idx + 1,
      item.productName,
      item.hsnSacCode,
      item.quantity,
      item.rate,
      item.quantity * item.rate,
      item.discount || 0,
      item.taxableValue,
      ...(invoice.totalCgst > 0 ? [item.cgst || 0, item.sgst || 0] : []),
      ...(invoice.totalIgst > 0 ? [item.igst || 0] : []),
      item.totalAmount,
    ]);

    // Totals row
    const totals = [
      [
        '', '', '', '', '', '', '', '', 
        ...(invoice.totalCgst > 0 ? ['', ''] : []),
        ...(invoice.totalIgst > 0 ? [''] : []),
        'Total Amount', invoice.totalAmount
      ]
    ];

    // Combine all rows
    const wsData = [
      ...details,
      itemsHeader,
      ...items,
      ...totals,
    ];

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths for neatness
    ws['!cols'] = [
      { wch: 6 },   // S.No
      { wch: 24 },  // Description
      { wch: 10 },  // HSN/SAC
      { wch: 6 },   // Qty
      { wch: 10 },  // Rate
      { wch: 12 },  // Amount
      { wch: 10 },  // Discount
      { wch: 14 },  // Taxable Value
      ...(invoice.totalCgst > 0 ? [{ wch: 10 }, { wch: 10 }] : []),
      ...(invoice.totalIgst > 0 ? [{ wch: 10 }] : []),
      { wch: 14 },  // Total
    ];

    // Optional: Set font and alignment for all cells (SheetJS Pro supports full styling, but for open source, only col widths)
    // For more advanced styling, consider exporting as HTML and opening in Excel.

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `Invoice_${invoice.invoiceNumber}.xlsx`);
  };

  // Add this function to your InvoiceView:
  function exportInvoiceAsHTML(invoice: Invoice, vehicleNumber?: string) {
    const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Calibri, Arial, sans-serif; background: #fff; }
          .container { max-width: 900px; margin: 32px auto; background: #fff; }
          .title { text-align: center; font-size: 2rem; font-weight: bold; margin-bottom: 8px; }
          .subtitle { text-align: center; font-size: 1.1rem; color: #444; margin-bottom: 24px; }
          .info-table { margin: 0 auto 24px auto; border: 1px solid #bbb; border-radius: 8px; background: #f9f9f9; }
          .info-table td { border: none; padding: 6px 18px; font-size: 1rem; }
          table.data-table { border-collapse: collapse; width: 100%; margin: 0 auto 24px auto; }
          table.data-table th, table.data-table td { border: 1px solid #888; padding: 8px 10px; text-align: center; font-size: 1rem; }
          table.data-table th { background: #f0f0f0; font-weight: bold; }
          .left { text-align: left; }
          .right { text-align: right; }
          .totals { font-weight: bold; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">TAX INVOICE</div>
          <div class="subtitle">Invoice No: <b>${invoice.invoiceNumber}</b></div>
          <table class="info-table">
            <tr><td><b>Date</b></td><td>${new Date(invoice.date).toLocaleDateString('en-IN')}</td></tr>
            <tr><td><b>Customer</b></td><td>${invoice.customerName}</td></tr>
            <tr><td><b>Status</b></td><td>${invoice.status}</td></tr>
            ${invoice.customerGstin ? `<tr><td><b>GSTIN</b></td><td>${invoice.customerGstin}</td></tr>` : ''}
            ${vehicleNumber ? `<tr><td><b>Vehicle Number</b></td><td>${vehicleNumber}</td></tr>` : ''}
          </table>
          <table class="data-table">
            <tr>
              <th>S.No</th>
              <th>Description</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Discount</th>
              <th>Taxable Value</th>
              ${invoice.totalCgst > 0 ? '<th>CGST</th><th>SGST</th>' : ''}
              ${invoice.totalIgst > 0 ? '<th>IGST</th>' : ''}
              <th>Total</th>
            </tr>
            ${invoice.items.map((item: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="left">${item.productName}</td>
                <td>${item.hsnSacCode}</td>
                <td>${item.quantity}</td>
                <td class="right">${item.rate}</td>
                <td class="right">${item.quantity * item.rate}</td>
                <td class="right">${item.discount || 0}</td>
                <td class="right">${item.taxableValue}</td>
                ${invoice.totalCgst > 0 ? `<td class="right">${item.cgst || 0}</td><td class="right">${item.sgst || 0}</td>` : ''}
                ${invoice.totalIgst > 0 ? `<td class="right">${item.igst || 0}</td>` : ''}
                <td class="right">${item.totalAmount}</td>
              </tr>
            `).join('')}
            <tr class="totals">
              <td colspan="${invoice.totalCgst > 0 ? 10 : invoice.totalIgst > 0 ? 9 : 8}" class="right">Total Amount</td>
              <td class="right">${invoice.totalAmount}</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNumber}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto px-2 sm:px-0 animate-fade-in">
      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 print:hidden">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/invoices')}
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
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {invoice.status === 'CREDIT' ? 'Credit' : 'Paid'}
            </span>
          </div>
          
          <div className="flex gap-2 mb-4 print:hidden">
            <button
              onClick={() => {
                if (typeof setInvoiceToEdit === 'function') setInvoiceToEdit(invoice);
                navigate('/invoices/edit');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handlePrintDirect}
              disabled={isPrinting}
              className={`
                relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium
                ${isPrinting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
                } 
                ${printSuccess === true ? 'bg-green-600 hover:bg-green-700' : ''}
                ${printSuccess === false ? 'bg-red-600 hover:bg-red-700' : ''}
                text-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              title="Send directly to your printer without preview"
            >
              {isPrinting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Printing...</span>
                </>
              ) : printSuccess === true ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Sent!</span>
                </>
              ) : printSuccess === false ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Failed</span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Send to Printer</span>
                  <span className="sm:hidden">Print</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrintPreview}
              disabled={isPrinting}
              className={`
                px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium
                ${isPrinting 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
                  : 'bg-gray-600 hover:bg-gray-700 hover:shadow-lg active:scale-95 text-white'
                }
                shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              `}
              title="Preview the invoice before printing"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Print Preview</span>
              <span className="sm:hidden">Preview</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => exportInvoiceAsHTML(invoice, vehicleNumber)}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-3 py-2 rounded-lg font-semibold shadow hover:bg-orange-700 transition active:scale-95"
            >
              <FileSpreadsheet className="h-5 w-5" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="flex justify-center print:bg-white print:p-0">
        <div
          id="invoice-print-area"
          className="print-invoice bg-white rounded-lg shadow-sm border border-gray-200"
          style={{
            maxWidth: '794px', // Only for screen
            width: '100%',
            margin: '24px auto',
            padding: '32px',
            boxSizing: 'border-box',
            fontSize: '14px',
            color: '#222',
          }}
        >
          <div className="p-2 sm:p-8 print:p-0">
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
                <div className="text-right min-w-[220px]">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">TAX INVOICE</h2>
                  <div className="text-gray-600 space-y-1 text-sm">
                    <p><span className="font-medium">Invoice No:</span> {invoice.invoiceNumber}</p>
                    <p><span className="font-medium">Date:</span> {new Date(invoice.date).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
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
                  {vehicleNumber && (
                    <p>
                      <span className="font-medium">Vehicle Number:</span> {vehicleNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 overflow-x-auto print:overflow-visible">
              <table
                className="w-full border-collapse border border-gray-300 text-xs"
                style={{ fontSize: '13px', tableLayout: 'fixed' }}
              >
                <colgroup>
                  <col style={{ width: '36px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '36px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '80px' }} />
                  {invoice.totalCgst > 0 && (
                    <>
                      <col style={{ width: '60px' }} />
                      <col style={{ width: '60px' }} />
                    </>
                  )}
                  {invoice.totalIgst > 0 && <col style={{ width: '60px' }} />}
                  <col style={{ width: '70px' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-2 py-1 text-left">S.No</th>
                    <th className="border px-2 py-1 text-left">Description</th>
                    <th className="border px-2 py-1 text-left">HSN/SAC</th>
                    <th className="border px-2 py-1 text-right">Qty</th>
                    <th className="border px-2 py-1 text-right">Rate</th>
                    <th className="border px-2 py-1 text-right">Amount</th>
                    <th className="border px-2 py-1 text-right">Discount</th>
                    <th className="border px-2 py-1 text-right">Taxable Value</th>
                    {invoice.totalCgst > 0 && (
                      <>
                        <th className="border px-2 py-1 text-right">CGST</th>
                        <th className="border px-2 py-1 text-right">SGST</th>
                      </>
                    )}
                    {invoice.totalIgst > 0 && (
                      <th className="border px-2 py-1 text-right">IGST</th>
                    )}
                    <th className="border px-2 py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border px-2 py-1 text-center">{index + 1}</td>
                      <td className="border px-2 py-1 text-left">{item.productName}</td>
                      <td className="border px-2 py-1 text-left">{item.hsnSacCode}</td>
                      <td className="border px-2 py-1 text-right whitespace-nowrap">{formatIndianNumber(item.quantity)}</td>
                      <td className="border px-2 py-1 text-right whitespace-nowrap">₹{formatIndianNumber(item.rate)}</td>
                      <td className="border px-2 py-1 text-right whitespace-nowrap">₹{formatIndianNumber(item.quantity * item.rate)}</td>
                      <td className="border px-2 py-1 text-right whitespace-nowrap">₹{formatIndianNumber(item.discount || 0)}</td>
                      <td className="border px-2 py-1 text-right whitespace-nowrap">₹{formatIndianNumber(item.taxableValue)}</td>
                      {invoice.totalCgst > 0 && (
                        <>
                          <td className="border px-2 py-1 text-right whitespace-nowrap">₹{formatIndianNumber(item.cgst || 0)}</td>
                          <td className="border px-2 py-1 text-right whitespace-nowrap">₹{formatIndianNumber(item.sgst || 0)}</td>
                        </>
                      )}
                      {invoice.totalIgst > 0 && (
                        <td className="border px-2 py-1 text-right whitespace-nowrap">₹{formatIndianNumber(item.igst || 0)}</td>
                      )}
                      <td className="border px-2 py-1 text-right whitespace-nowrap font-medium">₹{formatIndianNumber(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
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
    </div>
  );
};

export default InvoiceView;