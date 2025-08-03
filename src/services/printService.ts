/**
 * Enhanced Print Service for GST Billing Application
 * Provides robust printing functionality with cross-platform compatibility
 */

export interface PrintOptions {
  suppressBrowserUI?: boolean;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'Letter' | 'Legal';
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  showPreview?: boolean;
}

class PrintService {
  private printStylesInjected = false;

  /**
   * Inject enhanced print styles to suppress browser headers/footers
   */
  private injectPrintStyles(): void {
    if (this.printStylesInjected) return;

    const printStyles = document.createElement('style');
    printStyles.id = 'enhanced-print-styles';
    printStyles.innerHTML = `
      @media print {
        /* Reset everything for clean printing */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          background: #fff !important;
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: 'Segoe UI', Arial, sans-serif !important;
          font-size: 12px !important;
          line-height: 1.4 !important;
          color: #000 !important;
        }

        /* Hide everything except invoice area */
        body * {
          visibility: hidden !important;
        }

        /* Show only invoice content */
        #invoice-print-area,
        #invoice-print-area * {
          visibility: visible !important;
        }

        /* Position invoice for optimal printing */
        #invoice-print-area {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0.4in !important;
          background: #fff !important;
          box-shadow: none !important;
          border: none !important;
          font-size: 12px !important;
        }

        /* Hide navigation, headers, footers */
        header, footer, nav, 
        .header, .footer, .navigation,
        .site-header, .site-footer, 
        .app-header, .app-footer,
        .top-bar, .bottom-bar,
        .sidebar, .menu,
        .print\\:hidden,
        [class*="header"], [class*="footer"], [class*="nav"] {
          display: none !important;
          visibility: hidden !important;
        }

        /* Page settings for clean output */
        @page {
          size: A4 !important;
          margin: 0.4in !important;
          
          /* Attempt to suppress browser headers/footers */
          @top-left { content: "" !important; }
          @top-center { content: "" !important; }
          @top-right { content: "" !important; }
          @bottom-left { content: "" !important; }
          @bottom-center { content: "" !important; }
          @bottom-right { content: "" !important; }
        }

        /* Remove page breaks inside invoice elements */
        .invoice-section, .invoice-item, .invoice-total {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Ensure tables print properly */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto !important;
        }

        tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }

        /* Force black text for printing */
        .invoice-content, .invoice-content * {
          color: #000 !important;
          background: transparent !important;
        }

        /* Hide buttons and interactive elements */
        button, .btn, .button, 
        input[type="button"], input[type="submit"],
        .action-buttons, .controls,
        [role="button"] {
          display: none !important;
        }
      }

      /* Print preparation styles */
      .print-preparing {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      }
    `;

    document.head.appendChild(printStyles);
    this.printStylesInjected = true;
    console.log('✅ Enhanced print styles injected');
  }

  /**
   * Prepare the document for printing
   */
  private preparePrintDocument(elementId: string): HTMLElement | null {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ Print element not found: ${elementId}`);
      return null;
    }

    // Inject print styles
    this.injectPrintStyles();

    // Ensure the element is visible and properly styled
    element.style.display = 'block';
    element.style.visibility = 'visible';

    // Add print-ready class
    element.classList.add('print-ready');

    return element;
  }

  /**
   * Show loading indicator during print preparation
   */
  private showPrintLoading(): HTMLElement {
    const loader = document.createElement('div');
    loader.className = 'print-preparing';
    loader.innerHTML = `
      <div style="text-align: center;">
        <div style="margin-bottom: 10px;">🖨️</div>
        <div>Preparing invoice for printing...</div>
      </div>
    `;
    document.body.appendChild(loader);
    return loader;
  }

  /**
   * Remove loading indicator
   */
  private hidePrintLoading(loader: HTMLElement): void {
    try {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    } catch (error) {
      console.warn('Could not remove print loader:', error);
    }
  }

  /**
   * Direct print - bypasses preview and goes straight to printer dialog
   */
  async printDirect(elementId: string = 'invoice-print-area', options: PrintOptions = {}): Promise<boolean> {
    console.log('🖨️ Starting direct print process...', options);
    
    const loader = this.showPrintLoading();
    
    try {
      // Prepare document
      const element = this.preparePrintDocument(elementId);
      if (!element) {
        throw new Error('Invoice content not found for printing');
      }

      // Small delay to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Focus the window for better print dialog behavior
      window.focus();

      // Apply print-specific page title
      const originalTitle = document.title;
      const invoiceTitle = options.showPreview ? 'Invoice Preview' : 'Invoice';
      document.title = `${invoiceTitle} - ${new Date().toLocaleDateString()}`;

      // Trigger print dialog directly
      const printPromise = new Promise<boolean>((resolve) => {
        const mediaQuery = window.matchMedia('print');
        
        const handlePrintStart = () => {
          console.log('🖨️ Print dialog opened');
          mediaQuery.removeEventListener('change', handlePrintStart);
        };

        const handleAfterPrint = () => {
          console.log('✅ Print process completed');
          document.title = originalTitle;
          window.removeEventListener('afterprint', handleAfterPrint);
          resolve(true);
        };

        mediaQuery.addEventListener('change', handlePrintStart);
        window.addEventListener('afterprint', handleAfterPrint);

        // Fallback timeout
        setTimeout(() => {
          document.title = originalTitle;
          resolve(true);
        }, 5000);
      });

      // Trigger the print
      window.print();

      return await printPromise;

    } catch (error) {
      console.error('❌ Direct print failed:', error);
      
      // Fallback to simple print
      try {
        window.print();
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback print also failed:', fallbackError);
        return false;
      }
    } finally {
      this.hidePrintLoading(loader);
    }
  }

  /**
   * Print with preview - shows browser's print preview
   */
  async printWithPreview(elementId: string = 'invoice-print-area', options: PrintOptions = {}): Promise<boolean> {
    console.log('👁️ Opening print preview...', options);
    
    try {
      // Prepare document
      const element = this.preparePrintDocument(elementId);
      if (!element) {
        throw new Error('Invoice content not found for print preview');
      }

      // Small delay to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Focus window and trigger print preview
      window.focus();
      
      // Set a temporary title
      const originalTitle = document.title;
      const previewTitle = options.showPreview !== false ? 'Invoice Preview' : 'Invoice';
      document.title = `${previewTitle} - ${new Date().toLocaleDateString()}`;

      // Use setTimeout to allow the browser to show preview
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);

      // Open print dialog (most browsers will show preview by default)
      window.print();

      return true;

    } catch (error) {
      console.error('❌ Print preview failed:', error);
      return false;
    }
  }

  /**
   * Check if printing is supported
   */
  isPrintingSupported(): boolean {
    return typeof window !== 'undefined' && 'print' in window;
  }

  /**
   * Get browser-specific print capabilities
   */
  getPrintCapabilities(): {
    supportsDirect: boolean;
    supportsPreview: boolean;
    browserInfo: string;
  } {
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;
    const isEdge = /Edg/.test(navigator.userAgent);

    let browserInfo = 'Unknown';
    if (isChrome) browserInfo = 'Chrome';
    else if (isFirefox) browserInfo = 'Firefox';
    else if (isSafari) browserInfo = 'Safari';
    else if (isEdge) browserInfo = 'Edge';

    return {
      supportsDirect: true, // All modern browsers support window.print()
      supportsPreview: true, // Most browsers show preview by default
      browserInfo
    };
  }

  /**
   * Clean up print styles (optional, for memory management)
   */
  cleanup(): void {
    const printStyles = document.getElementById('enhanced-print-styles');
    if (printStyles) {
      printStyles.remove();
      this.printStylesInjected = false;
      console.log('🧹 Print styles cleaned up');
    }
  }
}

// Export singleton instance
export const printService = new PrintService();

// Export class for custom instances if needed
export { PrintService };
