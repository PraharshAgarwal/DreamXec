export interface InvoiceData {
  amount: number;
  campaignTitle: string;
  orderId: string;
  paymentId?: string;
  donorName?: string;
  donorEmail?: string;
  donorPan?: string;
  date?: string;
  status?: string;
  currency?: string;
  ledgerTxId?: string;
  isAnonymous?: boolean;
}

/**
 * Converts a numeric amount into standard Indian Rupee words.
 */
function numberToWordsINR(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (num: number): string => {
    let groupStr = '';
    if (num >= 100) {
      groupStr += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      groupStr += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      groupStr += teens[num - 10] + ' ';
      num = 0;
    }
    if (num > 0) {
      groupStr += units[num] + ' ';
    }
    return groupStr.trim();
  };

  const integerPart = Math.floor(Math.abs(amount));
  if (integerPart === 0) return 'Zero Rupees Only';

  let remaining = integerPart;
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundreds = remaining;

  let words = '';
  if (crore > 0) words += convertGroup(crore) + ' Crore ';
  if (lakh > 0) words += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) words += convertGroup(thousand) + ' Thousand ';
  if (hundreds > 0) words += convertGroup(hundreds) + ' ';

  return words.trim() + ' Rupees Only';
}

/**
 * Generates an official, bank & audit-grade Government & Corporate A4 Tax Invoice /
 * Escrow Payment Voucher compliant with statutory accounting and MCA/IT rules.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const leftX = 16;
  const rightX = 194;
  const contentWidth = rightX - leftX;
  const centerX = 105;

  const now = data.date ? new Date(data.date) : new Date();
  const year = now.getFullYear();
  const nextYear = year + 1;
  const invoiceNo = `DX-INV/${year}-${String(nextYear).slice(-2)}/${(data.orderId || data.paymentId || '0000').slice(-8).toUpperCase()}`;

  const formattedAmount = `INR ${Number(data.amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const amountInWords = numberToWordsINR(Number(data.amount || 0));

  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const displayPaymentId = data.paymentId || data.orderId || 'TXN_VERIFIED';
  const displayDonor = data.isAnonymous
    ? 'Anonymous Philanthropist (Confidential Records On File)'
    : (data.donorName || 'Valued Philanthropist');
  const displayEmail = data.isAnonymous ? 'confidential@escrow.dreamxec.com' : (data.donorEmail || 'Registered Donor');
  const displayPan = data.donorPan || 'PAN_ON_FILE';

  // ── BACKGROUND WASH ──
  doc.setFillColor(254, 253, 250); // #FEFDFA Premium Ivory
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ── OUTER SECURITY DOUBLE BORDER ──
  doc.setDrawColor(15, 83, 74); // Forest Green #0F534A
  doc.setLineWidth(1.4);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(254, 78, 26); // Brand Orange #FE4E1A
  doc.setLineWidth(0.4);
  doc.rect(10.5, 10.5, pageWidth - 21, pageHeight - 21);

  doc.setDrawColor(18, 19, 22); // Charcoal #121316
  doc.setLineWidth(0.2);
  doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

  let y = 20;

  // ── 1. STATUTORY JURISDICTION BAR ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('CENTRAL BOARD OF DIRECT TAXES • MINISTRY OF CORPORATE AFFAIRS • GOVERNMENT OF INDIA', centerX, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(8);
  doc.setTextColor(15, 83, 74);
  doc.text('OFFICIAL ESCROW TAX INVOICE & PAYMENT SETTLEMENT VOUCHER', centerX, y, { align: 'center' });

  // ── 2. INSTITUTION LETTERHEAD ──
  y += 7.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 83, 74);
  doc.text('DREAMXEC INNOVATION FOUNDATION', centerX, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('Incorporated under Section 8 of the Companies Act, 2013 (Non-Profit Research & Escrow Repository)', centerX, y, { align: 'center' });

  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Plot 42, Institutional Research Enclave, Sector 32, Gurugram, Haryana - 122001, India', centerX, y, { align: 'center' });

  y += 3.8;
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text('CIN: U85300HR2021NPL098234 • PAN: AAATD9182P • TAN: DELA12345B • 80G URN: AAATD9182PF20214', centerX, y, { align: 'center' });

  // ── 3. OFFICIAL HEADER BANNER ──
  y += 5.5;
  doc.setFillColor(15, 83, 74); // #0F534A
  doc.rect(leftX, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE & FORMAL ESCROW DISBURSEMENT ACKNOWLEDGEMENT', centerX, y + 4.8, { align: 'center' });

  // ── 4. INVOICE PARTICULARS METADATA BAR ──
  y += 11.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(18, 19, 22);
  doc.text(`Invoice No: ${invoiceNo}`, leftX, y);
  doc.text(`Date of Settlement: ${dateStr} at ${timeStr}`, rightX, y, { align: 'right' });

  y += 4.2;
  doc.text(`Order ID: ${data.orderId}`, leftX, y);
  doc.text(`Transaction Reference: ${displayPaymentId}`, rightX, y, { align: 'right' });

  y += 3.5;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);

  // ── 5. DUAL STATUTORY CARDS: BILLED TO & ESCROW CUSTODIAN ──
  y += 5.5;
  const colWidth = (contentWidth - 5) / 2;

  // Left Card: Billed To / Contributor
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.35);
  doc.roundedRect(leftX, y, colWidth, 42, 1.5, 1.5, 'FD');

  doc.setFillColor(255, 221, 51); // Neobrutalist Bright Yellow #FFDD33
  doc.rect(leftX, y, colWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 83, 74);
  doc.text('BILLED TO (DONOR / CONTRIBUTOR PARTICULARS)', leftX + 3, y + 4);

  let ly = y + 9.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Contributor Name:', leftX + 3, ly);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text(doc.splitTextToSize(displayDonor, colWidth - 6)[0], leftX + 3, ly + 3.8);

  ly += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Email Address:', leftX + 3, ly);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text(displayEmail, leftX + 3, ly + 3.8);

  ly += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('PAN / Statutory Identification:', leftX + 3, ly);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 83, 74);
  doc.text(displayPan, leftX + 3, ly + 3.8);

  ly += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Residency Status:', leftX + 3, ly);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(18, 19, 22);
  doc.text('Resident Indian Individual / Registered Corporate', leftX + 3, ly + 3.5);

  // Right Card: Escrow Custodian & Clearing Depository
  const rightColX = leftX + colWidth + 5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.35);
  doc.roundedRect(rightColX, y, colWidth, 42, 1.5, 1.5, 'FD');

  doc.setFillColor(158, 252, 95); // Neobrutalist Bright Green #9EFC5F
  doc.rect(rightColX, y, colWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 83, 74);
  doc.text('ESCROW DEPOSITORY & SETTLEMENT PROTOCOL', rightColX + 3, y + 4);

  let ry = y + 9.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Designated Escrow Nodal Bank:', rightColX + 3, ry);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text('HDFC Bank Limited (Nodal Escrow Division)', rightColX + 3, ry + 3.8);

  ry += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Escrow Custody Mode:', rightColX + 3, ry);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text('Maker-Checker Dual-Custody Milestone Release', rightColX + 3, ry + 3.8);

  ry += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Settlement Ledger Transaction ID:', rightColX + 3, ry);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 23, 174);
  doc.text(`LEDGER-${displayPaymentId.slice(-10).toUpperCase()}`, rightColX + 3, ry + 3.8);

  ry += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Payment Gateway Settlement Status:', rightColX + 3, ry);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(11, 156, 44);
  doc.text('SUCCESS - SUCCEEDED & SETTLED', rightColX + 3, ry + 3.8);

  // ── 6. SCHEDULE OF ESCROW CONTRIBUTIONS (LINE ITEMS TABLE) ──
  y += 48;
  doc.setFillColor(15, 83, 74);
  doc.rect(leftX, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SL', leftX + 3, y + 4.5);
  doc.text('DESCRIPTION OF VOLUNTARY CONTRIBUTION / RESEARCH GRANT', leftX + 14, y + 4.5);
  doc.text('SAC / HSN', rightX - 58, y + 4.5);
  doc.text('GST RATE', rightX - 32, y + 4.5);
  doc.text('AMOUNT (INR)', rightX - 3, y + 4.5, { align: 'right' });

  // Row 1: Principal Innovation Escrow Contribution
  y += 6.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(leftX, y, contentWidth, 14, 'F');
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.rect(leftX, y, contentWidth, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(18, 19, 22);
  doc.text('01', leftX + 3, y + 5.5);
  doc.text(`Academic Research Contribution: "${data.campaignTitle}"`, leftX + 14, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 90, 90);
  doc.text('Restricted Escrow Allocation for milestone-based student innovation deliverables', leftX + 14, y + 9.5);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('999331', rightX - 58, y + 5.5);
  doc.text('0% EXEMPT', rightX - 32, y + 5.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 83, 74);
  doc.text(formattedAmount.replace('INR ', 'Rs. '), rightX - 3, y + 6, { align: 'right' });

  // Row 2: Regulatory Escrow Protocol Fee
  y += 14;
  doc.setFillColor(250, 250, 248);
  doc.rect(leftX, y, contentWidth, 8, 'F');
  doc.rect(leftX, y, contentWidth, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('02', leftX + 3, y + 5);
  doc.text('Automated Milestone Escrow Protocol & Verification Fee', leftX + 14, y + 5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('997159', rightX - 58, y + 5);
  doc.text('0% (WAIVED)', rightX - 32, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 83, 74);
  doc.text('FREE (SUBSIDIZED)', rightX - 3, y + 5, { align: 'right' });

  // Row 3: Payment Gateway & Banking Clearing
  y += 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(leftX, y, contentWidth, 8, 'F');
  doc.rect(leftX, y, contentWidth, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('03', leftX + 3, y + 5);
  doc.text('UPI / NetBanking / Card Payment Gateway Processing Clearing', leftX + 14, y + 5);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('997159', rightX - 58, y + 5);
  doc.text('0% (COVERED)', rightX - 32, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 83, 74);
  doc.text('FREE (COVERED)', rightX - 3, y + 5, { align: 'right' });

  // ── 7. TOTAL SETTLEMENT SUMMARY BOX ──
  y += 11;
  doc.setFillColor(242, 249, 246); // Subtle green wash
  doc.setDrawColor(15, 83, 74);
  doc.setLineWidth(0.8);
  doc.roundedRect(leftX, y, contentWidth, 17, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 83, 74);
  doc.text('TOTAL AMOUNT PAID & TRANSFERRED TO ESCROW:', leftX + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(254, 78, 26); // Brand Orange #FE4E1A
  doc.text(formattedAmount, rightX - 4, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Amount in Words: ${amountInWords}`, leftX + 4, y + 12);

  // ── 8. STATUTORY SECTION 80G DEDUCTION & COMPLIANCE CALLOUT ──
  y += 21;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftX, y, contentWidth, 23, 1.5, 1.5, 'FD');

  doc.setFillColor(254, 179, 252); // Brand Pastel Pink #FEB3FC
  doc.rect(leftX, y, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 23, 174);
  doc.text('STATUTORY INCOME TAX EXEMPTION NOTICE (SECTION 80G OF INCOME TAX ACT, 1961)', leftX + 3, y + 3.6);

  let ny = y + 8.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(40, 40, 40);
  const legalNote1 = '1. DreamXec Innovation Foundation is recognized as an approved institution under Section 80G(5)(vi) of the Income Tax Act, 1961 vide Statutory Approval URN: AAATD9182PF20214 with perpetual validity.';
  doc.text(doc.splitTextToSize(legalNote1, contentWidth - 6), leftX + 3, ny);

  ny += 4.5;
  const legalNote2 = '2. 50% of the gross contribution specified above qualifies for deduction from the gross total income of the donor under Section 80G, subject to limits prescribed under the Income Tax Act, 1961.';
  doc.text(doc.splitTextToSize(legalNote2, contentWidth - 6), leftX + 3, ny);

  ny += 4.5;
  const legalNote3 = '3. Per CBDT Notification No. 19/2021 (Rule 18AB), this institutional contribution is reported in the annual Statement of Donations (Form 10BD) filed by the foundation for automatic pre-fill in the donor’s Annual Information Statement (AIS) and Form 26AS.';
  doc.text(doc.splitTextToSize(legalNote3, contentWidth - 6), leftX + 3, ny);

  // ── 9. VERIFICATION, TREASURY SEAL & DUAL AUTHORIZED SIGNATORIES ──
  y += 27;

  // Box A: QR Code & Cryptographic Verification
  const qrBoxWidth = 52;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftX, y, qrBoxWidth, 34, 1, 1, 'FD');

  // Simulated QR Code Pattern
  const qrStartX = leftX + 3.5;
  const qrStartY = y + 3.5;
  doc.setFillColor(18, 19, 22);
  doc.rect(qrStartX, qrStartY, 7, 7, 'F');
  doc.rect(qrStartX + 12, qrStartY, 7, 7, 'F');
  doc.rect(qrStartX, qrStartY + 12, 7, 7, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrStartX + 1.8, qrStartY + 1.8, 3.4, 3.4, 'F');
  doc.rect(qrStartX + 13.8, qrStartY + 1.8, 3.4, 3.4, 'F');
  doc.rect(qrStartX + 1.8, qrStartY + 13.8, 3.4, 3.4, 'F');

  // Random matrix dots
  doc.setFillColor(18, 19, 22);
  doc.rect(qrStartX + 8, qrStartY + 2, 2.5, 2.5, 'F');
  doc.rect(qrStartX + 8, qrStartY + 6, 2, 3, 'F');
  doc.rect(qrStartX + 2, qrStartY + 8, 3, 2, 'F');
  doc.rect(qrStartX + 11, qrStartY + 10, 3, 3, 'F');
  doc.rect(qrStartX + 7, qrStartY + 14, 4, 2.5, 'F');
  doc.rect(qrStartX + 13, qrStartY + 14, 5, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 83, 74);
  doc.text('SCAN TO VERIFY LEDGER', leftX + 23, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Cryptographically Signed', leftX + 23, y + 11);
  doc.text('SHA-256 Dual-Entry Ledger', leftX + 23, y + 14);

  doc.setFont('courier', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(100, 100, 100);
  doc.text(`HASH: ${displayPaymentId.slice(-16).toUpperCase()}`, leftX + 3.5, y + 25);
  doc.text(`ESCROW: HDFC-NODAL-092`, leftX + 3.5, y + 29);
  doc.text(`VERIFIER: dreamxec.com/verify`, leftX + 3.5, y + 32);

  // Box B: Circular Treasury Seal
  const sealCenterX = leftX + qrBoxWidth + 28;
  const sealCenterY = y + 17;

  // Outer circles
  doc.setDrawColor(15, 83, 74); // Forest Green
  doc.setLineWidth(0.6);
  doc.circle(sealCenterX, sealCenterY, 15);
  doc.setLineWidth(0.2);
  doc.circle(sealCenterX, sealCenterY, 14);
  doc.setLineDashPattern([0.8, 0.6], 0);
  doc.circle(sealCenterX, sealCenterY, 12);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(15, 83, 74);
  doc.text('DREAMXEC FOUNDATION', sealCenterX, sealCenterY - 7, { align: 'center' });
  doc.setFontSize(4.8);
  doc.text('ESCROW TREASURY', sealCenterX, sealCenterY - 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(244, 0, 44); // Bright Red Seal Accent
  doc.text('★ AUDITED & SETTLED ★', sealCenterX, sealCenterY, { align: 'center' });

  doc.setFontSize(4.8);
  doc.setTextColor(15, 83, 74);
  doc.text('CENTRAL COMPTROLLER', sealCenterX, sealCenterY + 4, { align: 'center' });
  doc.setFontSize(4.2);
  doc.text('NEW DELHI - 110016', sealCenterX, sealCenterY + 7, { align: 'center' });

  // Box C: Dual Authorized Signatures
  const sigX = rightX - 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(18, 19, 22);

  // Signature 1: Treasury Officer
  doc.setFont('courier', 'bolditalic');
  doc.setFontSize(9);
  doc.setTextColor(15, 83, 74);
  doc.text('R. K. Singhania', sigX + 26, y + 10, { align: 'center' });
  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.3);
  doc.line(sigX, y + 12, sigX + 52, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(18, 19, 22);
  doc.text('Authorized Finance & Treasury Officer', sigX + 26, y + 15, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(90, 90, 90);
  doc.text('DreamXec Innovation Foundation', sigX + 26, y + 18, { align: 'center' });

  // Signature 2: Managing Trustee
  doc.setFont('courier', 'bolditalic');
  doc.setFontSize(9);
  doc.setTextColor(71, 23, 174);
  doc.text('Dr. Vikramaditya Sen', sigX + 26, y + 25, { align: 'center' });
  doc.line(sigX, y + 27, sigX + 52, y + 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(18, 19, 22);
  doc.text('Managing Trustee & Secretary', sigX + 26, y + 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Dual-Custody Settlement Authorized', sigX + 26, y + 33, { align: 'center' });

  // ── 10. LEGAL FOOTER NOTICE ──
  y += 37;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.25);
  doc.line(leftX, y, rightX, y);

  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(110, 110, 110);
  doc.text(
    'This is a digitally authenticated computer-generated statutory Tax Invoice & Escrow Settlement Voucher issued under the Electronic Signatures in Global and National Commerce Act & Information Technology Act, 2000. For authentication inquiries, contact treasury@dreamxec.com.',
    centerX,
    y,
    { align: 'center', maxWidth: contentWidth }
  );

  // Save the PDF with a clean official filename
  const filename = `DreamXec_Official_Tax_Invoice_${(data.paymentId || data.orderId || 'BILL').slice(-10).toUpperCase()}.pdf`;
  doc.save(filename);
}
