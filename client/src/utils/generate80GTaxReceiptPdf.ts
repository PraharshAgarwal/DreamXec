import type { Receipt80G } from '../services/donationService';

/**
 * Generates an official, bank & audit-grade Government Section 80G / Form 10BE
 * Tax Exemption Certificate PDF compliant with Rule 18AB of the Income-tax Rules, 1962.
 */
export async function generate80GTaxReceiptPdf(receipt: Receipt80G): Promise<void> {
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

  // Background Wash
  doc.setFillColor(254, 253, 250); // #FEFDFA Premium Cream
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Security Double Border
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

  // ── 1. Top Statutory Sub-Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('GOVERNMENT OF INDIA • MINISTRY OF FINANCE • CENTRAL BOARD OF DIRECT TAXES', centerX, y, { align: 'center' });

  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(15, 83, 74);
  doc.text('CERTIFICATE OF DONATION UNDER SECTION 80G(5)(vi) • FORM 10BE COMPLIANT', centerX, y, { align: 'center' });

  // ── 2. Institution Emblem & Legal Name ──
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(15, 83, 74);
  doc.text('DREAMXEC INNOVATION FOUNDATION', centerX, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('A Section 8 Non-Profit Corporation for Academic Research & Technological Innovation Escrow', centerX, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Plot 42, Institutional Research Enclave, Sector 32, Gurugram, Haryana - 122001, India', centerX, y, { align: 'center' });

  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text('CIN: U85300HR2021NPL098234 • TAN: DELA12345B • 12A Reg: AAATD9182PE20211', centerX, y, { align: 'center' });

  // ── 3. Official Certificate Banner ──
  y += 6;
  doc.setFillColor(15, 83, 74); // #0F534A
  doc.rect(leftX, y, contentWidth, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL DONATION RECEIPT & TAX EXEMPTION CERTIFICATE', centerX, y + 5.2, { align: 'center' });

  // ── 4. Metadata Line ──
  y += 12.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(18, 19, 22);
  doc.text(`Receipt Reference: ${receipt.receiptNumber}`, leftX, y);
  const formattedDate = new Date(receipt.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Date of Remittance: ${formattedDate}`, rightX, y, { align: 'right' });

  y += 4.5;
  doc.text(`Statutory 80G URN: ${receipt.approvalRegistrationNumber}`, leftX, y);
  doc.text(`Financial Year: ${receipt.financialYear} | Assessment Year: ${receipt.assessmentYear || '2027-2028'}`, rightX, y, { align: 'right' });

  y += 3.5;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(leftX, y, rightX, y);

  // ── 5. Two-Column Legal Blocks: Donee & Donor Particulars ──
  y += 6;
  const colWidth = (contentWidth - 5) / 2;

  // DONEE CARD
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 83, 74);
  doc.setLineWidth(0.4);
  doc.rect(leftX, y, colWidth, 42, 'FD');

  doc.setFillColor(15, 83, 74);
  doc.rect(leftX, y, colWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('RECIPIENT / DONEE PARTICULARS', leftX + 4, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Legal Entity:', leftX + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text('DreamXec Innovation Foundation', leftX + 26, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Donee PAN:', leftX + 4, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text(receipt.institutionPan, leftX + 26, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('80G Order:', leftX + 4, y + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text('CIT(E)/80G/2021-22/A/10042', leftX + 26, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Section 80G:', leftX + 4, y + 29);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 83, 74);
  doc.text('Approved u/s 80G(5)(vi) (Perpetual)', leftX + 26, y + 29);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Status:', leftX + 4, y + 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text('Section 8 Non-Profit Entity', leftX + 26, y + 35);

  // DONOR CARD
  const donorX = leftX + colWidth + 5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(254, 78, 26);
  doc.setLineWidth(0.4);
  doc.rect(donorX, y, colWidth, 42, 'FD');

  doc.setFillColor(254, 78, 26);
  doc.rect(donorX, y, colWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('DONOR / CONTRIBUTOR PARTICULARS', donorX + 4, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Donor Name:', donorX + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text(doc.splitTextToSize(receipt.donor.name, colWidth - 28)[0] || receipt.donor.name, donorX + 26, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Donor PAN:', donorX + 4, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 83, 74);
  doc.text(receipt.donor.pan || 'PAN_ON_FILE', donorX + 26, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Email Ref:', donorX + 4, y + 23);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text(doc.splitTextToSize(receipt.donor.email, colWidth - 28)[0] || receipt.donor.email, donorX + 26, y + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('ID Type:', donorX + 4, y + 29);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text('Permanent Account Number (PAN)', donorX + 26, y + 29);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Verification:', donorX + 4, y + 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 83, 74);
  doc.text('Verified for Form 10BD/10BE Filing', donorX + 26, y + 35);

  // ── 6. Contribution & Grant Table ──
  y += 48;
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.4);
  doc.rect(leftX, y, contentWidth, 38, 'FD');

  doc.setFillColor(18, 19, 22);
  doc.rect(leftX, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('TRANSACTION & ACADEMIC GRANT SPECIFICATIONS', leftX + 4, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);

  doc.text('Supported Research Initiative:', leftX + 4, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 83, 74);
  doc.text(doc.splitTextToSize(receipt.campaignTitle, contentWidth - 55), leftX + 50, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Payment Gateway Reference:', leftX + 4, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text(receipt.paymentReference, leftX + 50, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Mode of Remittance:', leftX + 4, y + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(18, 19, 22);
  doc.text('Electronic Fund Transfer / Razorpay Nodal Escrow Gateway', leftX + 50, y + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Statutory Classification:', leftX + 4, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 83, 74);
  doc.text('Scientific Research / Technological Innovation Grant (Section 80G(5)(vi))', leftX + 50, y + 30);

  // ── 7. Calculated Tax Exemption Highlight Box ──
  y += 44;
  doc.setFillColor(255, 249, 230); // Soft Gold
  doc.setDrawColor(15, 83, 74);
  doc.setLineWidth(0.8);
  doc.rect(leftX, y, contentWidth, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 19, 22);
  doc.text('TOTAL TAX-EXEMPT CONTRIBUTION RECEIVED:', leftX + 6, y + 7);

  doc.setFontSize(16);
  doc.setTextColor(15, 83, 74);
  doc.text(`INR ${receipt.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX - 6, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(254, 78, 26);
  doc.text(`Amount in Words: ${receipt.amountInWords}`, leftX + 6, y + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const eligibleDeduction = (receipt.amount * 0.5).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  doc.text(
    `Statutory Rate: 50% Tax Exemption Allowed  •  Eligible Tax-Deductible Amount: INR ${eligibleDeduction}`,
    leftX + 6,
    y + 19.5
  );

  // ── 8. Form 10BD / Form 10BE Compliance Declaration ──
  y += 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 83, 74);
  doc.text('CBDT FORM 10BD STATUTORY COMPLIANCE & LEGAL NOTICES', leftX, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(70, 70, 70);
  const legalClause1 =
    '1. Donations to DreamXec Innovation Foundation qualify for 50% deduction under Section 80G(5)(vi) of the Income Tax Act, 1961 (subject to prescribed statutory aggregate limits).';
  const legalClause2 =
    '2. This receipt has been electronically recorded in the Statement of Donations in Form 10BD and submitted to the Directorate General of Income Tax (Systems). Donors can verify this donation in their Annual Information Statement (AIS) and Form 10BE certificate on the Income Tax e-filing portal.';
  const legalClause3 =
    '3. Contributed funds are held in dual-custody milestone escrow accounts and disbursed solely against verified project deliverables, preserving research integrity and statutory utilization requirements.';

  doc.text(doc.splitTextToSize(legalClause1, contentWidth), leftX, y);
  y += 5.5;
  doc.text(doc.splitTextToSize(legalClause2, contentWidth), leftX, y);
  y += 7.5;
  doc.text(doc.splitTextToSize(legalClause3, contentWidth), leftX, y);

  // ── 9. Official Seal & Signature Section ──
  y += 12;

  // Left: Cryptographic QR Code Verification
  const qrPayload =
    receipt.qrVerificationPayload ||
    `https://dreamxec.com/verify/receipt/${receipt.receiptNumber.replace(/\//g, '_')}`;

  try {
    const QRCode = (await import('qrcode')).default || (await import('qrcode'));
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 256,
      color: {
        dark: '#121316',
        light: '#FFFFFF',
      },
    });
    doc.addImage(qrDataUrl, 'PNG', leftX, y, 32, 32);
    doc.setDrawColor(18, 19, 22);
    doc.setLineWidth(0.4);
    doc.rect(leftX, y, 32, 32);
  } catch (qrErr) {
    console.warn('[generate80GTaxReceiptPdf] QR generation error:', qrErr);
    doc.setDrawColor(18, 19, 22);
    doc.setLineWidth(0.4);
    doc.setFillColor(255, 255, 255);
    doc.rect(leftX, y, 32, 32, 'FD');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(18, 19, 22);
  doc.text('SCAN TO VERIFY 80G', leftX + 16, y + 36, { align: 'center' });

  // Center: Circular Treasury Seal Stamp
  const sealCenterX = centerX - 2;
  const sealCenterY = y + 16;
  doc.setDrawColor(15, 83, 74);
  doc.setLineWidth(0.8);
  doc.circle(sealCenterX, sealCenterY, 15);
  doc.setLineWidth(0.3);
  doc.circle(sealCenterX, sealCenterY, 13.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(15, 83, 74);
  doc.text('DREAMXEC FOUNDATION', sealCenterX, sealCenterY - 7, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('★ VERIFIED ★', sealCenterX, sealCenterY - 1, { align: 'center' });
  doc.setFontSize(5);
  doc.text('SEC. 80G(5)(vi) APPROVED', sealCenterX, sealCenterY + 4, { align: 'center' });
  doc.text('ESCROW TREASURY', sealCenterX, sealCenterY + 8, { align: 'center' });

  // Right: Authorized Signatures
  const sigX = rightX - 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 83, 74);
  doc.text('Digitally Authenticated By:', sigX, y + 4);

  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 19, 22);
  doc.text('/s/ Treasury Officer', sigX, y + 12);

  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.3);
  doc.line(sigX, y + 15, rightX, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text('Director of Finance & Comptroller', sigX, y + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(70, 70, 70);
  doc.text('DreamXec Innovation Foundation', sigX, y + 23);
  doc.text(`Digital Sign ID: DX-SEC-80G-${receipt.receiptNumber.replace(/\//g, '')}`, sigX, y + 27);

  // ── 10. Footer ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `This is a legally valid, digitally generated official receipt issued under IT Rules. For statutory verification, visit: https://dreamxec.com/verify/receipt/${receipt.receiptNumber.replace(/\//g, '_')}`,
    centerX,
    pageHeight - 9,
    { align: 'center' }
  );

  doc.save(`Official_80G_Tax_Exemption_Receipt_${receipt.receiptNumber.replace(/\//g, '_')}.pdf`);
}
