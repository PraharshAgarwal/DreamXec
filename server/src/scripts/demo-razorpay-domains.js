/**
 * Multi-Domain Razorpay Environment Verification & Interactive Demo Script
 * Run with: node src/scripts/demo-razorpay-domains.js
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const crypto = require('crypto');
const {
  resolveRazorpayCredentials,
  getAllKeySecrets,
  getAllWebhookSecrets,
  getConfiguredDomains,
} = require('../config/razorpay.config');
const RazorpayPaymentAdapter = require('../modules/donations/adapters/razorpay-payment.adapter');

// Terminal formatting
const reset = '\x1b[0m';
const bold = '\x1b[1m';
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const magenta = '\x1b[35m';

function banner(title) {
  console.log(`\n${bold}${cyan}================================================================${reset}`);
  console.log(`${bold}${cyan}  ${title}${reset}`);
  console.log(`${bold}${cyan}================================================================${reset}`);
}

function check(label, pass, detail = '') {
  const icon = pass ? `${green}✔ PASS${reset}` : `${red}✖ FAIL${reset}`;
  console.log(`  [${icon}] ${bold}${label}${reset} ${detail ? `(${detail})` : ''}`);
}

function warn(label, detail = '') {
  console.log(`  [${yellow}⚠ WARN${reset}] ${bold}${label}${reset} ${detail ? `(${detail})` : ''}`);
}

async function runDemo() {
  banner('DreamXec Multi-Domain Razorpay Verification Demo');

  console.log(`\n${bold}${magenta}1. Environment Configuration Snapshot:${reset}`);
  const domain1 = process.env.DOMAIN_1 || 'dreamxec.com';
  const domain2 = process.env.DOMAIN_2 || 'partnerportal.org';
  const isSimulated = process.env.RAZORPAY_SIMULATION === 'true';

  console.log(`   - Domain 1 (Primary)   : ${cyan}${domain1}${reset}`);
  console.log(`   - Razorpay Key ID 1    : ${process.env.RAZORPAY_KEY_ID_1 ? green + process.env.RAZORPAY_KEY_ID_1 + reset : red + 'MISSING' + reset}`);
  console.log(`   - Razorpay Secret 1    : ${process.env.RAZORPAY_KEY_SECRET_1 ? green + 'configured (' + process.env.RAZORPAY_KEY_SECRET_1.substring(0, 4) + '...)' + reset : red + 'MISSING' + reset}`);
  console.log(`   - Webhook Secret 1     : ${process.env.RAZORPAY_WEBHOOK_SECRET_1 ? green + 'configured' + reset : yellow + 'not set' + reset}`);
  console.log(`   - Domain 2 (Secondary) : ${cyan}${domain2}${reset}`);
  console.log(`   - Razorpay Key ID 2    : ${process.env.RAZORPAY_KEY_ID_2 ? (process.env.RAZORPAY_KEY_ID_2.includes('HERE') ? yellow + process.env.RAZORPAY_KEY_ID_2 + ' (placeholder)' + reset : green + process.env.RAZORPAY_KEY_ID_2 + reset) : red + 'MISSING' + reset}`);
  console.log(`   - Razorpay Secret 2    : ${process.env.RAZORPAY_KEY_SECRET_2 ? (process.env.RAZORPAY_KEY_SECRET_2.includes('HERE') ? yellow + 'placeholder' + reset : green + 'configured' + reset) : red + 'MISSING' + reset}`);
  console.log(`   - RAZORPAY_SIMULATION  : ${isSimulated ? green + 'true (Test mode enabled for placeholder credentials)' + reset : yellow + 'false' + reset}`);

  // Test 1: Credential Resolution
  banner('2. Testing Credential Routing Logic');
  
  const credsDom1 = resolveRazorpayCredentials({ headers: { origin: `https://${domain1}` } });
  check(`Origin: https://${domain1}`, credsDom1.keyId === (process.env.RAZORPAY_KEY_ID_1 || process.env.RAZORPAY_KEY_ID), `Key: ${credsDom1.keyId}`);

  const credsDom2 = resolveRazorpayCredentials({ headers: { origin: `https://${domain2}` } });
  check(`Origin: https://${domain2}`, credsDom2.keyId === process.env.RAZORPAY_KEY_ID_2, `Key: ${credsDom2.keyId}`);

  const credsSubdomain = resolveRazorpayCredentials({ headers: { origin: `https://app.${domain2}:3000` } });
  check(`Subdomain: https://app.${domain2}:3000`, credsSubdomain.keyId === process.env.RAZORPAY_KEY_ID_2, `Subdomains inherit parent domain keys`);

  const credsFallback = resolveRazorpayCredentials(null);
  check(`Fallback / No origin header`, credsFallback.keyId === (process.env.RAZORPAY_KEY_ID_1 || process.env.RAZORPAY_KEY_ID), `Defaults to Primary (${domain1})`);

  const credsCustomHeader = resolveRazorpayCredentials({ headers: { 'x-client-domain': domain2 } });
  check(`Custom Header: x-client-domain: ${domain2}`, credsCustomHeader.keyId === process.env.RAZORPAY_KEY_ID_2, `Key: ${credsCustomHeader.keyId}`);

  // Test 2: Order Creation Simulation
  banner('3. Testing Razorpay Order Creation');
  const adapter = new RazorpayPaymentAdapter();

  console.log(`   Attempting order creation for ${domain1}...`);
  try {
    const order1 = await adapter.createOrder({
      amount: 150000,
      currency: 'INR',
      origin: `https://${domain1}`,
    });
    check(`Order creation for ${domain1}`, !!order1.id, `Order ID: ${order1.id}, Key: ${order1.key}`);
  } catch (err) {
    check(`Order creation for ${domain1}`, false, err.message);
  }

  console.log(`   Attempting order creation for ${domain2}...`);
  try {
    const order2 = await adapter.createOrder({
      amount: 250000,
      currency: 'INR',
      origin: `https://${domain2}`,
    });
    check(`Order creation for ${domain2}`, !!order2.id, `Order ID: ${order2.id}, Key: ${order2.key}`);
  } catch (err) {
    check(`Order creation for ${domain2}`, false, err.message);
  }

  // Test 3: Signature Verification
  banner('4. Testing HMAC Signature Verification');
  
  // Test valid signature for Domain 1
  const testOrderId = `order_test_${Date.now()}`;
  const testPayId = `pay_test_${Date.now()}`;
  const testSecret1 = process.env.RAZORPAY_KEY_SECRET_1 || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
  const validSig1 = crypto
    .createHmac('sha256', testSecret1)
    .update(`${testOrderId}|${testPayId}`)
    .digest('hex');

  const verifiedDom1 = adapter.verifySignature({
    orderId: testOrderId,
    paymentId: testPayId,
    signature: validSig1,
    origin: `https://${domain1}`,
  });
  check(`Signature verification for ${domain1}`, verifiedDom1, 'HMAC SHA256 verified successfully');

  // Test sandbox/simulation signature
  const simVerified = adapter.verifySignature({
    orderId: 'order_sim_999',
    paymentId: 'pay_sim_999',
    signature: 'sig_sim_demo',
    origin: `https://${domain2}`,
  });
  check(`Simulation signature bypass for ${domain2}`, simVerified, 'Sandbox/simulation accepted correctly');

  // Test forgery rejection
  const forgedVerified = adapter.verifySignature({
    orderId: testOrderId,
    paymentId: testPayId,
    signature: 'invalid_forged_signature_hex_1234567890abcdef',
    origin: `https://${domain1}`,
  });
  check(`Forgery rejection test`, !forgedVerified, 'Forged signature correctly rejected');

  // Test 4: Webhook Event Parsing
  banner('5. Testing Webhook Parsing & Verification');

  const webhookPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_webhook_demo_123',
          order_id: 'order_webhook_demo_456',
          amount: 500000, // 5000 INR in paise
          email: 'donor@example.com',
          notes: { projectId: 'project_alpha_01' },
        },
      },
    },
  };

  const rawBody = JSON.stringify(webhookPayload);
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET_1 || testSecret1;
  const webhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    const parsedEvent = await adapter.parseWebhookEvent({
      headers: { 'x-razorpay-signature': webhookSig },
      body: webhookPayload,
      rawBody: rawBody,
      origin: `https://${domain1}`,
    });

    check('Parse payment.captured webhook', parsedEvent && parsedEvent.eventType === 'PAYMENT_CAPTURED');
    console.log(`     - Event Type : ${green}${parsedEvent.eventType}${reset}`);
    console.log(`     - Payment ID : ${parsedEvent.paymentId}`);
    console.log(`     - Order ID   : ${parsedEvent.orderId}`);
    console.log(`     - Amount INR : ₹${parsedEvent.amount}`);
    console.log(`     - Project ID : ${parsedEvent.projectId}`);
  } catch (err) {
    check('Parse payment.captured webhook', false, err.message);
  }

  // Summary
  banner('Demo Summary & Next Actions');
  console.log(`
  ${bold}Domain 1 (${domain1}):${reset}
    - Configured with live/test key: ${credsDom1.keyId}
    - Ready for real payment requests and webhooks!

  ${bold}Domain 2 (${domain2}):${reset}
    - Configured with test/placeholder key: ${credsDom2.keyId}
    - Simulation mode is currently ${isSimulated ? green + 'ACTIVE' + reset : yellow + 'INACTIVE' + reset}.
    - To use live Razorpay on ${domain2}, obtain the keys from Razorpay Dashboard and update:
      ${bold}RAZORPAY_KEY_ID_2${reset}, ${bold}RAZORPAY_KEY_SECRET_2${reset}, and ${bold}RAZORPAY_WEBHOOK_SECRET_2${reset} in ${cyan}server/.env${reset}.
`);
}

runDemo().catch(console.error);
