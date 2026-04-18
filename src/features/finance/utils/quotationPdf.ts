export const printQuotation = () => {
  window.print();
};

export const getPrintStyles = () => `
  @media print {
    body * { visibility: hidden; }
    #quote-print-area, #quote-print-area * { visibility: visible; }
    #quote-print-area {
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
      margin: 15mm;
    }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
`;
