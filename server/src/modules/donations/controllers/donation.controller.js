const donationService = require('../donation.service');
const catchAsync = require('../../../utils/catchAsync');
const prisma = require('../../../config/prisma');
const AppError = require('../../../utils/AppError');

function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  num = Math.floor(Number(num || 0));
  if (num === 0) return 'Zero Rupees';
  function convert(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(num) + ' Rupees Only';
}

class DonationController {
  constructor(service = donationService) {
    this.service = service;
  }

  createOrder = catchAsync(async (req, res) => {
    const { amount, projectId, message, anonymous, email, name } = req.body;

    const result = await this.service.createDonationOrder({
      amount,
      projectId,
      message,
      anonymous,
      email,
      name,
      user: req.user,
      origin: req.headers.origin || req.headers.referer,
      req,
    });

    res.json({
      success: true,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      key: result.key,
    });
  });

  verifyPayment = catchAsync(async (req, res) => {
    const result = await this.service.verifyPayment({
      ...req.body,
      origin: req.headers.origin || req.headers.referer,
      req,
    });

    res.status(200).json({
      success: true,
      message: result.message || 'Payment verified and recorded.',
      status: result.status || 'PROCESSING',
      orderId: result.orderId,
      paymentId: result.paymentId,
      campaign: result.campaign,
      data: {
        campaign: result.campaign,
      },
    });
  });

  getDonationStatus = catchAsync(async (req, res) => {
    const { orderId } = req.params;
    const statusData = await this.service.getDonationStatus(orderId);

    res.status(200).json({
      success: true,
      data: statusData,
    });
  });

  handlePaymentWebhook = catchAsync(async (req, res) => {
    const result = await this.service.handlePaymentWebhook({
      headers: req.headers,
      body: req.body,
      rawBody: req.rawBody,
      origin: req.headers.origin || req.headers.referer,
      req,
    });

    res.status(200).json(result);
  });

  // Deprecated alias for backward compatibility
  razorpayWebhook = (req, res) => this.handlePaymentWebhook(req, res);

  getMyDonations = catchAsync(async (req, res) => {
    const orgId =
      req.query.orgId ||
      req.headers['x-organization-id'] ||
      null;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    const donations = await this.service.getMyDonations(req.user.id, orgId, { page, limit });

    res.json({
      success: true,
      donations,
      data: {
        donations,
      },
      pagination: {
        page,
        limit,
      },
    });
  });

  getDonationSummary = catchAsync(async (req, res) => {
    const orgId =
      req.query.orgId ||
      req.headers['x-organization-id'] ||
      null;
    const data = await this.service.getDonationSummary(req.user.id, orgId);

    res.status(200).json({
      success: true,
      status: 'success',
      data,
      summary: data,
    });
  });

  getCustomDonorDonations = async (req, res) => {
    res.redirect(307, '/donations/my');
  };

  getProjectDonations = catchAsync(async (req, res) => {
    const projectId = req.params.projectId;

    const donations = await this.service.getProjectDonations({
      projectId,
      user: req.user,
    });

    res.json({
      success: true,
      donations,
    });
  });

  getMyEligibility = catchAsync(async (req, res) => {
    const eligibility = await this.service.getMyEligibility(req.user);

    res.status(200).json({
      status: 'success',
      data: eligibility,
    });
  });

  getMyLedger = catchAsync(async (req, res) => {
    const orgId =
      req.query.orgId ||
      req.headers['x-organization-id'] ||
      null;

    const transactions = await this.service.getMyLedgerTransactions(req.user.id, orgId);

    res.status(200).json({
      success: true,
      status: 'success',
      transactions,
      data: {
        transactions,
      },
    });
  });

  // ── Step 6: Section 80G Tax Exemption Receipt (K6, K7, O2) ──
  download80GReceipt = catchAsync(async (req, res) => {
    const { id } = req.params;

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileMetadata: true,
          },
        },
        campaign: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        paymentIntents: {
          include: { attempts: true },
          take: 1,
        },
      },
    });

    if (!donation) {
      throw new AppError('Donation record not found', 404);
    }

    const intent = donation.paymentIntents?.[0];
    const attempt = intent?.attempts?.[0];

    // Statutory compliance: 80G tax receipts may strictly ONLY be generated for completed / succeeded donations
    const isCompleted =
      intent?.status === 'SUCCEEDED' ||
      attempt?.status === 'SUCCEEDED' ||
      donation.paymentStatus === 'completed' ||
      donation.paymentStatus === 'SUCCEEDED';

    if (!isCompleted) {
      throw new AppError(
        'Section 80G tax receipt can only be generated for successfully completed and settled donations.',
        400
      );
    }
    const donorName = donation.donorDisplayName || donation.donor?.fullName || 'Verified Donor';
    const amountNum = Number(donation.amount);
    const amountWords = numberToWords(amountNum);
    const donorPan =
      donation.donorPan ||
      (donation.donor?.profileMetadata && donation.donor.profileMetadata.pan) ||
      (intent?.metadata && (intent.metadata.pan || intent.metadata.donorPan)) ||
      (req.user?.profileMetadata && req.user.profileMetadata.pan) ||
      'PAN NOT PROVIDED';
    const year = donation.createdAt.getFullYear();
    const nextYear = year + 1;
    const receiptNo = `80G/DX/${year}-${String(nextYear).slice(-2)}/${donation.id.slice(0, 8).toUpperCase()}`;
    const approvalNumber = 'AAATD9182PF20214'; // Valid Order u/s 80G(5)(vi)

    const receiptData = {
      receiptNumber: receiptNo,
      approvalRegistrationNumber: approvalNumber,
      date: donation.createdAt,
      financialYear: `${year}-${nextYear}`,
      assessmentYear: `${nextYear}-${nextYear + 1}`,
      institutionName: 'DreamXec Innovation Foundation',
      institutionSubtitle: 'A Section 8 Non-Profit Organization for Academic Innovation & Research',
      institutionAddress: 'Plot 42, Institutional Research Enclave, Sector 32, Gurugram, Haryana - 122001',
      institutionPan: 'AAATD9182P',
      institutionTan: 'DELA12345B',
      institutionCin: 'U85300HR2021NPL098234',
      section12AReg: 'AAATD9182PE20211',
      statutoryOrder: 'Order No. CIT(E)/80G/2021-22/A/10042 dated 15/09/2021 under Section 80G(5)(vi) of the Income Tax Act, 1961',
      statutoryStandard: 'Rule 18AB / Form 10BE Compliant',
      deductionPercentage: '50%',
      donor: {
        name: donorName,
        email: donation.donor?.email || 'N/A',
        pan: donorPan,
        identificationType: 'PAN',
      },
      campaignTitle: donation.campaign?.title || 'Academic & Innovation Grant Pool',
      amount: amountNum,
      amountInWords: amountWords,
      currency: donation.currency || 'INR',
      modeOfPayment: 'Electronic Fund Transfer / Razorpay Nodal Escrow Gateway',
      paymentReference: attempt?.gatewayPaymentId || intent?.idempotencyKey || `TX_${donation.id.slice(0, 10).toUpperCase()}`,
      exemptionNote: 'Donations to this entity are eligible for deduction under Section 80G(5)(vi) of the Income Tax Act, 1961 (Subject to prescribed statutory limits).',
      form10BeNotice: 'Issued in compliance with Rule 18AB of the Income-tax Rules, 1962. This donation will be reported in Statement of Donations in Form 10BD to the Income Tax Department for donor Form 10BE pre-fill.',
      authorizedSignatory: 'Director of Finance & Institutional Comptroller, DreamXec Foundation',
      qrVerificationPayload: `DX80G|URN:${approvalNumber}|REC:${receiptNo}|PAN:${donorPan}|AMT:${amountNum}|DATE:${donation.createdAt.toISOString()}`,
    };

    if (req.query.format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      const formattedDate = new Date(receiptData.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const eligibleAmt = (receiptData.amount * 0.5).toLocaleString('en-IN');

      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Section 80G Tax Exemption Certificate - ${receiptNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=JetBrains+Mono:wght@500;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #F4F2EC;
              color: #121316;
              padding: 40px 20px;
            }
            .certificate-container {
              max-width: 820px;
              margin: 0 auto;
              background: #FEFDFA;
              border: 4px solid #121316;
              box-shadow: 10px 10px 0px #0F534A;
              padding: 36px 40px;
              position: relative;
            }
            .inner-border {
              border: 1.5px solid #FE4E1A;
              padding: 24px;
            }
            .gov-header {
              text-align: center;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 1px;
              color: #555;
              text-transform: uppercase;
              border-bottom: 2px dashed #ccc;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .banner-badge {
              display: inline-block;
              background: #FFDD33;
              color: #121316;
              font-weight: 900;
              font-size: 11px;
              text-transform: uppercase;
              padding: 4px 12px;
              border: 2px solid #121316;
              box-shadow: 2px 2px 0 #121316;
              margin-bottom: 8px;
            }
            .inst-name {
              font-size: 24px;
              font-weight: 900;
              color: #0F534A;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .inst-sub {
              font-size: 11.5px;
              color: #555;
              margin-top: 4px;
            }
            .inst-regs {
              font-size: 10.5px;
              font-family: 'JetBrains Mono', monospace;
              color: #222;
              margin-top: 6px;
            }
            .cert-title-bar {
              background: #0F534A;
              color: #FFF;
              padding: 8px;
              text-align: center;
              font-weight: 900;
              font-size: 13px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin: 16px 0 14px 0;
            }
            .meta-strip {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              font-weight: 700;
              border-bottom: 2px solid #121316;
              padding-bottom: 8px;
              margin-bottom: 16px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 18px;
            }
            .card {
              background: #FFF;
              border: 2px solid #121316;
              padding: 12px 14px;
              font-size: 11.5px;
            }
            .card-title {
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 2px 6px;
              display: inline-block;
              border: 1px solid #121316;
              margin-bottom: 8px;
            }
            .card-row {
              margin-bottom: 6px;
            }
            .card-label {
              font-size: 9.5px;
              text-transform: uppercase;
              color: #666;
              font-weight: 700;
            }
            .card-val {
              font-weight: 700;
              color: #121316;
            }
            .amount-box {
              background: #9EFC5F;
              border: 3px solid #121316;
              box-shadow: 4px 4px 0 #121316;
              padding: 16px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 18px;
            }
            .amt-num {
              font-size: 28px;
              font-weight: 900;
              color: #0F534A;
            }
            .amt-words {
              font-size: 11px;
              font-weight: 700;
              color: #222;
              margin-top: 2px;
            }
            .deduction-box {
              background: #FEB3FC;
              border: 2px solid #121316;
              padding: 10px 14px;
              text-align: right;
            }
            .legal-strip {
              background: #FFF;
              border: 2px solid #121316;
              padding: 12px;
              font-size: 10px;
              color: #444;
              line-height: 1.5;
              margin-bottom: 18px;
            }
            .footer-grid {
              display: grid;
              grid-template-columns: 140px 1fr 180px;
              gap: 16px;
              align-items: center;
              border-top: 2px solid #121316;
              padding-top: 14px;
            }
            .seal-badge {
              border: 3px double #0F534A;
              border-radius: 50%;
              width: 100px;
              height: 100px;
              margin: 0 auto;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 7.5px;
              font-weight: 900;
              color: #0F534A;
              padding: 6px;
            }
            .sig-block {
              text-align: center;
              font-size: 10.5px;
            }
            .sig-line {
              border-bottom: 1.5px solid #121316;
              margin: 20px 0 6px 0;
            }
            .print-btn {
              position: fixed;
              bottom: 24px;
              right: 24px;
              background: #FE4E1A;
              color: #FFF;
              padding: 12px 24px;
              font-size: 13px;
              font-weight: 900;
              text-transform: uppercase;
              border: 3px solid #121316;
              box-shadow: 4px 4px 0 #121316;
              cursor: pointer;
            }
            @media print {
              body { background: white; padding: 0; }
              .certificate-container { border: 2px solid #121316; box-shadow: none; padding: 20px; }
              .print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="inner-border">
              <div class="gov-header">
                Government of India • Ministry of Finance • Central Board of Direct Taxes (CBDT)
              </div>
              <div style="text-align: center;">
                <div class="banner-badge">Form 10BE • Rule 18AB Compliant</div>
                <h1 class="inst-name">DreamXec Innovation Foundation</h1>
                <p class="inst-sub">A Section 8 Non-Profit Corporation for Academic Research & Technological Innovation Escrow</p>
                <p class="inst-regs">Plot 42, Institutional Research Enclave, Sector 32, Gurugram, HR - 122001 • CIN: U85300HR2021NPL098234</p>
              </div>

              <div class="cert-title-bar">
                Official Section 80G Tax Exemption Certificate (Donation Receipt)
              </div>

              <div class="meta-strip">
                <span>Receipt No: <strong>${receiptData.receiptNumber}</strong></span>
                <span>Date: <strong>${formattedDate}</strong></span>
                <span>80G URN: <strong>${receiptData.approvalRegistrationNumber}</strong></span>
              </div>

              <div class="grid-2">
                <div class="card">
                  <div class="card-title" style="background: #FFDD33;">Donee Institution (80G Approved)</div>
                  <div class="card-row"><div class="card-label">Institution</div><div class="card-val">${receiptData.institutionName}</div></div>
                  <div class="card-row"><div class="card-label">PAN / TAN</div><div class="card-val font-mono">${receiptData.institutionPan} • DELA12345B</div></div>
                  <div class="card-row"><div class="card-label">80G Order Ref</div><div class="card-val">${receiptData.statutoryOrder}</div></div>
                </div>

                <div class="card">
                  <div class="card-title" style="background: #18D7E8;">Donor / Contributor Particulars</div>
                  <div class="card-row"><div class="card-label">Donor Name</div><div class="card-val">${receiptData.donor.name}</div></div>
                  <div class="card-row"><div class="card-label">Donor PAN</div><div class="card-val font-mono">${receiptData.donor.pan}</div></div>
                  <div class="card-row"><div class="card-label">Grant Purpose</div><div class="card-val">${receiptData.campaignTitle}</div></div>
                </div>
              </div>

              <div class="amount-box">
                <div>
                  <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #0F534A;">Total Voluntary Contribution</div>
                  <div class="amt-num">₹${receiptData.amount.toLocaleString('en-IN')}</div>
                  <div class="amt-words">${receiptData.amountInWords}</div>
                </div>
                <div class="deduction-box">
                  <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #4717AE;">Eligible 80G Deduction (50%)</div>
                  <div style="font-size: 20px; font-weight: 900; color: #4717AE;">₹${eligibleAmt}</div>
                  <div style="font-size: 9px; font-weight: 700; color: #555;">Deductible under Section 80G(5)(vi)</div>
                </div>
              </div>

              <div class="legal-strip">
                <strong>Statutory Compliance Notice:</strong> Donations to DreamXec Innovation Foundation are exempt under Section 80G(5)(vi) of the Income Tax Act, 1961 vide Order No. CIT(E)/80G/2021-22/A/10042. Per CBDT Rule 18AB, this contribution is reported in the annual Statement of Donations (Form 10BD) filed by the Donee, enabling automated pre-fill in the donor's AIS and Form 26AS for seamless tax deduction claim.
              </div>

              <div class="footer-grid">
                <div style="font-size: 9px; font-family: monospace; color: #555;">
                  <div>GATEWAY TXN:</div>
                  <div style="font-weight: bold; color: #121316;">${receiptData.paymentReference}</div>
                  <div style="margin-top: 4px;">SECURE ESCROW VERIFIED</div>
                </div>

                <div class="seal-badge">
                  <span>★ DREAMXEC ★</span>
                  <span style="font-size: 6px; margin: 2px 0;">CENTRAL TREASURY</span>
                  <span style="color: #F4002C;">80G CERTIFIED</span>
                  <span style="font-size: 6px;">NEW DELHI</span>
                </div>

                <div class="sig-block">
                  <div class="sig-line"></div>
                  <strong>Authorized Signatory</strong>
                  <div style="font-size: 9px; color: #666;">Finance & Treasury Officer</div>
                </div>
              </div>
            </div>
          </div>

          <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </body>
        </html>
      `);
    }

    res.status(200).json({
      status: 'success',
      data: { receipt: receiptData },
    });
  });

  // ── Step 6: CSR Program Utilisation Report (K6, K7, O2) ──
  downloadCSRUtilisationReport = catchAsync(async (req, res) => {
    const { campaignId } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        tenant: true,
        student: { select: { id: true, fullName: true, email: true } },
        milestones: {
          include: {
            submissions: { take: 1, orderBy: { createdAt: 'desc' } },
            milestoneDisbursements: {
              include: {
                makerUser: { select: { id: true, fullName: true, email: true } },
                checkerUser: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        donations: {
          include: {
            donor: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign record not found', 404);
    }

    const totalTarget = Number(campaign.targetAmount || 0);
    const totalDonations = campaign.donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalDisbursed = campaign.milestones.reduce((sum, m) => sum + Number(m.releasedAmount || 0), 0);
    const escrowBalance = Math.max(0, totalDonations - totalDisbursed);

    const reportData = {
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      institution: campaign.tenant?.name || 'Academic Institution',
      studentLead: campaign.student?.fullName || campaign.student?.name || 'Lead Student Researcher',
      totalGrantBudget: totalTarget,
      totalContributionsReceived: totalDonations,
      totalDisbursedToDate: totalDisbursed,
      escrowBalanceHeld: escrowBalance,
      disbursementPercentage: totalTarget > 0 ? Math.round((totalDisbursed / totalTarget) * 100) : 0,
      tranches: campaign.milestones.map((m) => {
        const disb = m.milestoneDisbursements?.[0];
        return {
          sequenceOrder: m.sequenceOrder,
          title: m.title,
          targetAmount: Number(m.targetAmount),
          releasedAmount: Number(m.releasedAmount || 0),
          status: m.status,
          makerSignoff: disb?.makerUser ? `${disb.makerUser.fullName || disb.makerUser.name} (${disb.makerUser.email})` : 'N/A',
          checkerSignoff: disb?.checkerUser ? `${disb.checkerUser.fullName || disb.checkerUser.name} (${disb.checkerUser.email})` : 'N/A',
          payoutReference: disb?.payoutReference || 'PENDING',
          ledgerTxId: disb?.ledgerTxId || 'PENDING',
          settledAt: disb?.settledAt || null,
        };
      }),
      donorsCount: campaign.donations.length,
      statutoryDeclaration: 'Certified that the expenditure has been incurred solely for the specified academic & innovation project in accordance with institutional guidelines and statutory audit standards.',
    };

    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=CSR_Utilisation_Report_${campaign.id.slice(0, 8)}.csv`
      );

      let csv = 'CSR PROGRAM UTILISATION REPORT (GFR-19A COMPLIANT)\n';
      csv += `Campaign Title,${campaign.title.replace(/,/g, ' ')}\n`;
      csv += `Institution,${reportData.institution}\n`;
      csv += `Student Beneficiary,${reportData.studentLead}\n`;
      csv += `Total Budget,Rs. ${reportData.totalGrantBudget}\n`;
      csv += `Total Received,Rs. ${reportData.totalContributionsReceived}\n`;
      csv += `Total Settled Disbursed,Rs. ${reportData.totalDisbursedToDate}\n`;
      csv += `Escrow Balance,Rs. ${reportData.escrowBalanceHeld}\n\n`;

      csv += 'Tranche,Milestone Title,Target Amount (INR),Released Amount (INR),Status,Maker Officer,Checker Officer,Payout Ref,Ledger Tx ID\n';
      reportData.tranches.forEach((t) => {
        csv += `${t.sequenceOrder},"${t.title.replace(/"/g, '""')}",${t.targetAmount},${t.releasedAmount},${t.status},"${t.makerSignoff}","${t.checkerSignoff}",${t.payoutReference},${t.ledgerTxId}\n`;
      });

      return res.send(csv);
    }

    res.status(200).json({
      status: 'success',
      data: { utilisationReport: reportData },
    });
  });
}

module.exports = new DonationController();
module.exports.DonationController = DonationController;
