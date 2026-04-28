const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || './service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function getOrCreateFolder(drive, folderName, parentId) {
  const res = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
  });
  if (res.data.files.length > 0) return res.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  return folder.data.id;
}

/**
 * Uploads a file buffer to Google Drive under /Applications/[orderId]/.
 * Returns { driveFileId, driveViewUrl }.
 */
async function uploadFileToDrive(fileBuffer, mimeType, fileName, orderId) {
  const drive        = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Ensure applicant subfolder exists
  const applicantFolderId = await getOrCreateFolder(drive, orderId, rootFolderId);

  const stream = Readable.from(fileBuffer);

  const response = await drive.files.create({
    requestBody: { name: fileName, parents: [applicantFolderId] },
    media:       { mimeType, body: stream },
    fields:      'id',
  });

  const fileId = response.data.id;

  // Make file publicly readable via link
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    driveFileId:  fileId,
    driveViewUrl: `https://drive.google.com/file/d/${fileId}/view`,
  };
}

module.exports = { uploadFileToDrive };
