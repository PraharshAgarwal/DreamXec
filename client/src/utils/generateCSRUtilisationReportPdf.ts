import type { CSRUtilisationReport } from '../services/donationService';

/**
 * Generates an official GFR-19A CSR Program Utilisation Report (A4 Landscape or Portrait PDF)
 * Required for Corporate CSR statutory filings, DST/AICTE grant compliance, and financial audits.
 */
export async function generateCSRUtilisationReportPdf(report: CSRUtilisationReport): Promise<void> {
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
  const centerX = 105;

  // Background
  doc.setFillColor(252, 251, 247);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Border
  doc.setDrawColor(18, 19, 22);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  let y = 18;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 83, 74);
  doc.text('FORM GFR 19-A', centerX, y, { align: 'center' });

  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(18, 19, 22);
  doc.text('FORM OF UTILIZATION CERTIFICATE (UC)', centerX, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Statutory CSR & Institutional Research Grant Accounting Under Indian Companies Act / DST Norms', centerX, y, { align: 'center' });

  // Summary Pill
  y += 8;
  doc.setFillColor(15, 83, 74);
  doc.rect(leftX, y, rightX - leftX, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('PROJECT PARTICULARS', leftX + 4, y + 5);

  y += 7;
  doc.setFillColor(255, 255, 255);
  doc.rect(leftX, y, rightX - leftX, 36, 'FD');
  doc.setDrawColor(18, 19, 22);
  doc.rect(leftX, y, rightX - leftX, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(18, 19, 22);

  doc.text('Campaign Title:', leftX + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.text(report.campaignTitle, leftX + 45, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.text('Host Institution:', leftX + 4, y + 14);
  doc.setFont('helvetica', 'bold');
  doc.text(report.institution, leftX + 45, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.text('Student Principal Lead:', leftX + 4, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.text(report.studentLead, leftX + 45, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.text('Sanctioned Grant Budget:', leftX + 4, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(254, 78, 26);
  doc.text(`INR ${report.totalGrantBudget.toLocaleString('en-IN')}`, leftX + 45, y + 28);

  // Financial Summary Cards
  y += 42;
  const colW = (rightX - leftX - 6) / 3;

  // Received
  doc.setFillColor(255, 255, 255);
  doc.rect(leftX, y, colW, 20, 'FD');
  doc.setDrawColor(18, 19, 22);
  doc.rect(leftX, y, colW, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('TOTAL RECEIVED', leftX + 3, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 83, 74);
  doc.text(`₹${report.totalContributionsReceived.toLocaleString('en-IN')}`, leftX + 3, y + 14);

  // Disbursed
  const col2X = leftX + colW + 3;
  doc.setFillColor(255, 255, 255);
  doc.rect(col2X, y, colW, 20, 'FD');
  doc.rect(col2X, y, colW, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('SETTLED & DISBURSED', col2X + 3, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(254, 78, 26);
  doc.text(`₹${report.totalDisbursedToDate.toLocaleString('en-IN')}`, col2X + 3, y + 14);

  // Escrow Held
  const col3X = col2X + colW + 3;
  doc.setFillColor(255, 221, 51);
  doc.rect(col3X, y, colW, 20, 'FD');
  doc.rect(col3X, y, colW, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text('HELD IN DUAL ESCROW', col3X + 3, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(18, 19, 22);
  doc.text(`₹${report.escrowBalanceHeld.toLocaleString('en-IN')}`, col3X + 3, y + 14);

  // Tranches Audit Table
  y += 26;
  doc.setFillColor(18, 19, 22);
  doc.rect(leftX, y, rightX - leftX, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('MILESTONE TRANCHES & MAKER-CHECKER AUDIT TRAIL', leftX + 4, y + 5);

  y += 7;
  doc.setFillColor(245, 245, 240);
  doc.rect(leftX, y, rightX - leftX, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(18, 19, 22);
  doc.text('#', leftX + 2, y + 4);
  doc.text('Milestone Deliverable', leftX + 10, y + 4);
  doc.text('Target', leftX + 70, y + 4);
  doc.text('Released', leftX + 90, y + 4);
  doc.text('Maker / Checker Signoffs', leftX + 115, y + 4);
  doc.text('Status', rightX - 20, y + 4);

  y += 6;
  report.tranches.forEach((t) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(leftX, y, rightX - leftX, 10, 'FD');
    doc.setDrawColor(200, 200, 200);
    doc.rect(leftX, y, rightX - leftX, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(18, 19, 22);

    doc.text(`${t.sequenceOrder}`, leftX + 2, y + 6);
    doc.text(doc.splitTextToSize(t.title, 55)[0], leftX + 10, y + 6);
    doc.text(`₹${t.targetAmount.toLocaleString('en-IN')}`, leftX + 70, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${t.releasedAmount.toLocaleString('en-IN')}`, leftX + 90, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const signoffSnippet = t.checkerSignoff !== 'N/A'
      ? `Checker: ${t.checkerSignoff.slice(0, 22)}`
      : t.makerSignoff !== 'N/A'
      ? `Maker: ${t.makerSignoff.slice(0, 22)}`
      : 'Awaiting Proof';
    doc.text(signoffSnippet, leftX + 115, y + 6);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(t.status === 'FUNDS_RELEASED' || t.status === 'COMPLETED' ? 15 : 244, t.status === 'FUNDS_RELEASED' || t.status === 'COMPLETED' ? 83 : 0, t.status === 'FUNDS_RELEASED' || t.status === 'COMPLETED' ? 74 : 44);
    doc.text(t.status, rightX - 22, y + 6);

    y += 10;
  });

  // Statutory Certification
  y += 6;
  doc.setFillColor(255, 255, 255);
  doc.rect(leftX, y, rightX - leftX, 32, 'FD');
  doc.setDrawColor(15, 83, 74);
  doc.setLineWidth(0.6);
  doc.rect(leftX, y, rightX - leftX, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 83, 74);
  doc.text('FORM GFR 19-A STATUTORY CERTIFICATION', leftX + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  const certText =
    `Certified that out of INR ${report.totalGrantBudget.toLocaleString('en-IN')} sanctioned and INR ${report.totalDisbursedToDate.toLocaleString('en-IN')} disbursed in favor of ${report.campaignTitle} during the financial year, a sum of INR ${report.totalDisbursedToDate.toLocaleString('en-IN')} has been properly utilized for the purpose for which it was sanctioned and that the balance of INR ${report.escrowBalanceHeld.toLocaleString('en-IN')} remaining unutilized in escrow will be released upon milestone verification.`;
  const splitCert = doc.splitTextToSize(certText, rightX - leftX - 8);
  doc.text(splitCert, leftX + 4, y + 14);

  // Signatures
  y += 38;
  doc.setDrawColor(120, 120, 120);
  doc.line(leftX, y + 10, leftX + 55, y + 10);
  doc.line(centerX - 25, y + 10, centerX + 25, y + 10);
  doc.line(rightX - 55, y + 10, rightX, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(18, 19, 22);
  doc.text('Principal Student Investigator', leftX + 2, y + 15);
  doc.text('Project Lead', leftX + 2, y + 19);

  doc.text('Finance & Accounts Officer', centerX - 22, y + 15);
  doc.text('Treasury Escrow Custody', centerX - 22, y + 19);

  doc.text('Dean / Registrar / Director', rightX - 52, y + 15);
  doc.text('Endorsing Institution', rightX - 52, y + 19);

  doc.save(`GFR19A_Utilisation_Report_${report.campaignTitle.replace(/\s+/g, '_').slice(0, 20)}.pdf`);
}
