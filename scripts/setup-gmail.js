// Simple script to help users get their Gmail OAuth tokens
// Run with: node scripts/setup-gmail.js

const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
);

const scopes = ['https://www.googleapis.com/auth/gmail.send'];

console.log('🔧 Gmail OAuth Setup Helper');
console.log('==========================');

if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
  console.error('❌ Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET environment variables');
  console.log('Please add these to your .env.local file first.');
  process.exit(1);
}

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('1. Open this URL in your browser:');
console.log('   ' + authUrl);
console.log('');
console.log('2. Complete the OAuth flow');
console.log('3. Copy the authorization code from the callback URL');
console.log('4. Run: node scripts/get-tokens.js [YOUR_CODE]');
console.log('');
console.log('Or simply visit: http://localhost:3000/api/auth/gmail (after starting the dev server)');
