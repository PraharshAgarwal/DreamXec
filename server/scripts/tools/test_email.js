require('dotenv').config();
const sendgridAdapter = require('./src/modules/email/adapters/sendgrid-email.adapter');

async function test() {
  console.log('Testing SendGrid Email Dispatch...');
  console.log('SendGrid Configured:', sendgridAdapter.isSendGridConfigured());
  console.log('From Email:', sendgridAdapter.fromEmail);

  const res = await sendgridAdapter.send({
    to: 'jaynrk2002@gmail.com',
    subject: 'DreamXec SendGrid Dispatch Test',
    text: 'Hello Jay! Your SendGrid email service is working perfectly.',
    html: '<h3>Hello Jay!</h3><p>Your SendGrid email service is working perfectly on DreamXec platform.</p>'
  });

  console.log('RESULT:', res);
}

test().catch(console.error);
