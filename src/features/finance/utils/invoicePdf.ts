export const printInvoice = () => {
  window.print();
};

export const getInvoicePrintStyles = () => `
  @media print {
    body * { visibility: hidden; }
    #invoice-print-area, #invoice-print-area * { visibility: visible; }
    #invoice-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .no-print { display: none !important; }
    @page {
      size: A4;
      margin: 10mm;
    }
    table { page-break-inside: auto; width: 100% !important; border-collapse: collapse; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    
    .print-text-right { text-align: right !important; }
    .print-text-center { text-align: center !important; }
    .print-font-bold { font-weight: bold !important; }
  }
`;
