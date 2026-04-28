const { google } = require('googleapis');
const { getGoogleAuthOptions } = require('./googleAuth');

function isSheetsConfigured() {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  return Boolean(sheetId && sheetId !== 'your_spreadsheet_id_here');
}

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth(
    getGoogleAuthOptions(['https://www.googleapis.com/auth/spreadsheets'])
  );
  return google.sheets({ version: 'v4', auth });
}

/**
 * Appends a row to the "Applications" sheet.
 * Columns A-U as defined in the spec.
 */
async function appendRow(values) {
  if (!isSheetsConfigured()) {
    return;
  }

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId:   process.env.GOOGLE_SHEETS_ID,
    range:           'Applications!A:U',
    valueInputOption: 'RAW',
    requestBody:     { values: [values] },
  });
}

module.exports = { appendRow };
