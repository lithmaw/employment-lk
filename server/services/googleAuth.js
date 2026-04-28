const fs = require('fs');
const path = require('path');

function getGoogleAuthOptions(scopes) {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT;

  if (rawCredentials) {
    try {
      return {
        credentials: JSON.parse(rawCredentials),
        scopes,
      };
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON_CONTENT: must be valid JSON');
    }
  }

  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || './service-account.json';
  const keyFilePath = path.resolve(keyFile);

  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`Google service account file not found: ${keyFilePath}`);
  }

  return {
    keyFile: keyFilePath,
    scopes,
  };
}

module.exports = { getGoogleAuthOptions };
