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

        /* Page break control */
        .invoice-section, .invoice-item, .invoice-total, .invoice-header {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Table printing optimization */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: auto !important;
        }

        tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }

        /* Ensure all text is black for printing */
        .invoice-content, 
        .invoice-content *,
        #invoice-print-area,
        #invoice-print-area * {
          color: #000 !important;
          background: transparent !important;
        }

        /* Make sure borders and lines are visible */
        .border, [class*="border"] {
          border-color: #000 !important;
        }
      }

      /* Loading indicator styles */
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
   * Detect browser and system capabilities for enhanced printing
   */
  private detectPrintCapabilities(): {
    hasModernPrintEvents: boolean;
    hasMatchMedia: boolean;
    browserName: string;
    recommendedMethod: string;
  } {
    const hasModernPrintEvents = 'onbeforeprint' in window && 'onafterprint' in window;
    const hasMatchMedia = window.matchMedia && typeof window.matchMedia === 'function';
    
    // Detect browser for optimal print handling
    const userAgent = navigator.userAgent.toLowerCase();
    let browserName = 'unknown';
    let recommendedMethod = 'standard';

    if (userAgent.includes('chrome')) {
      browserName = 'chrome';
      recommendedMethod = 'afterprint'; // Chrome handles afterprint well
    } else if (userAgent.includes('firefox')) {
      browserName = 'firefox';
      recommendedMethod = 'mediaquery'; // Firefox prefers media query approach
    } else if (userAgent.includes('safari')) {
      browserName = 'safari';
      recommendedMethod = 'timeout'; // Safari can be unreliable with print events
    } else if (userAgent.includes('edge')) {
      browserName = 'edge';
      recommendedMethod = 'afterprint'; // Edge supports modern events
    }

    console.log('🔍 Print capabilities detected:', {
      hasModernPrintEvents,
      hasMatchMedia,
      browserName,
      recommendedMethod
    });

    return {
      hasModernPrintEvents,
      hasMatchMedia,
      browserName,
      recommendedMethod
    };
  }

  /**
   * Enhanced method to handle all connected printers
   */
  private async checkPrinterAvailability(): Promise<{
    hasPrinters: boolean;
    printerCount: number;
    canDetectPrinters: boolean;
  }> {
    try {
      // Modern browsers may support printer detection
      if ('getInstalledRelatedApps' in navigator) {
        // Future API - not widely supported yet
        console.log('🖨️ Modern printer detection available');
      }

      // Check if print dialog can be opened (indirect printer detection)
      const printAvailable = window.print && typeof window.print === 'function';
      
      return {
        hasPrinters: printAvailable, // Assume printers available if print function exists
        printerCount: printAvailable ? 1 : 0, // Cannot detect exact count reliably
        canDetectPrinters: false // Current web standards don't allow direct printer enumeration
      };
    } catch (error) {
      console.warn('⚠️ Printer detection failed:', error);
      return {
        hasPrinters: true, // Assume printers are available
        printerCount: 1,
        canDetectPrinters: false
      };
    }
  }

  /**
   * Enhanced direct print - bypasses preview and works with all connected printers
   */
  async printDirect(elementId: string = 'invoice-print-area', options: PrintOptions = {}): Promise<boolean> {
    console.log('🖨️ Starting enhanced direct print process...', options);
    
    // Detect system capabilities
    const capabilities = this.detectPrintCapabilities();
    const printerInfo = await this.checkPrinterAvailability();
    
    console.log('🔧 System info:', { capabilities, printerInfo });
    
    const loader = this.showPrintLoading();
    
    try {
      // Prepare document with enhanced error handling
      const element = this.preparePrintDocument(elementId);
      if (!element) {
        throw new Error('Invoice content not found for printing - please refresh and try again');
      }

      // Enhanced delay based on browser type
      const delay = capabilities.browserName === 'safari' ? 300 : 200;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Focus window and bring to front for better printer dialog access
      window.focus();
      
      // Try to request focus if available (for better cross-browser support)
      if (document.hasFocus && !document.hasFocus()) {
        window.focus();
      }

      // Apply print-specific page title for better printer queue identification
      const originalTitle = document.title;
      const timestamp = new Date().toLocaleString();
      document.title = `Invoice Print - ${timestamp}`;

      // Enhanced print execution with browser-specific optimizations
      const printPromise = new Promise<boolean>((resolve) => {
        let printResolved = false;
        
        // Adaptive timeout based on browser
        const timeoutDuration = capabilities.browserName === 'safari' ? 8000 : 5000;
        const timeoutId = setTimeout(() => {
          if (!printResolved) {
            console.log('⏰ Print timeout reached, assuming success');
            printResolved = true;
            resolve(true);
          }
        }, timeoutDuration);

        const resolvePrint = (success: boolean) => {
          if (!printResolved) {
            printResolved = true;
            clearTimeout(timeoutId);
            document.title = originalTitle;
            resolve(success);
          }
        };

        // Method selection based on browser capabilities
        const useMethod = capabilities.recommendedMethod;

        // Method 1: Modern browser print events (most reliable for Chrome/Edge)
        if ((useMethod === 'afterprint' || useMethod === 'standard') && capabilities.hasModernPrintEvents) {
          const handleAfterPrint = () => {
            console.log('✅ Print completed (afterprint event)');
            window.removeEventListener('afterprint', handleAfterPrint);
            resolvePrint(true);
          };

          const handleBeforePrint = () => {
            console.log('📄 Print dialog opened (beforeprint event)');
            window.removeEventListener('beforeprint', handleBeforePrint);
          };

          window.addEventListener('afterprint', handleAfterPrint, { once: true });
          window.addEventListener('beforeprint', handleBeforePrint, { once: true });
        }

        // Method 2: Media query listener (good for Firefox)
        if ((useMethod === 'mediaquery' || useMethod === 'standard') && capabilities.hasMatchMedia) {
          const mediaQuery = window.matchMedia('print');
          const handlePrintChange = (mq: MediaQueryListEvent | MediaQueryList) => {
            if (!mq.matches) { // Print dialog closed
              console.log('✅ Print completed (media query)');
              if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handlePrintChange);
              }
              resolvePrint(true);
            }
          };

          if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handlePrintChange);
          } else {
            // Fallback for older browsers
            mediaQuery.addListener(handlePrintChange);
          }
        }

        // Method 3: Timeout-based resolution (Safari and fallback)
        if (useMethod === 'timeout' || (!capabilities.hasModernPrintEvents && !capabilities.hasMatchMedia)) {
          console.log('⏰ Using timeout-based print resolution');
          setTimeout(() => {
            if (!printResolved) {
              resolvePrint(true);
            }
          }, 2000);
        }

        // Enhanced window.print() call with error handling
        try {
          console.log('🖨️ Calling window.print()...');
          window.print();
          
          // Immediate resolution for very basic browsers
          if (!capabilities.hasModernPrintEvents && !capabilities.hasMatchMedia && useMethod === 'standard') {
            setTimeout(() => resolvePrint(true), 1000);
          }
        } catch (printError) {
          console.error('❌ window.print() failed:', printError);
          resolvePrint(false);
        }
      });

      const result = await printPromise;
      console.log('📋 Enhanced print process result:', result);
      return result;

    } catch (error) {
      console.error('❌ Enhanced direct print error:', error);
      return false;
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
      await new Promise(resolve => setTimeout(resolve, 150));

      // Focus the window for better print dialog behavior
      window.focus();

      // Apply print-specific page title
      const originalTitle = document.title;
      document.title = 'Invoice Preview';

      // Open print preview (same as window.print() but explicitly for preview)
      try {
        window.print();
        document.title = originalTitle;
        return true;
      } catch (error) {
        document.title = originalTitle;
        throw error;
      }

    } catch (error) {
      console.error('❌ Print preview error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const printService = new PrintService();
