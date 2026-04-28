const { google } = require('googleapis');
const path = require('path');

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || './service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

/**
 * Appends a row to the "Applications" sheet.
 * Columns A-U as defined in the spec.
 */
async function appendRow(values) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId:   process.env.GOOGLE_SHEETS_ID,
    range:           'Applications!A:U',
    valueInputOption: 'RAW',
    requestBody:     { values: [values] },
  });
}

module.exports = { appendRow };
