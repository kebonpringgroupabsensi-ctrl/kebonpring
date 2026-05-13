/**
 * Google Drive API Utility
 * Handles file uploads to Google Drive using OAuth2 Refresh Token
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

/**
 * Gets a fresh access token using the refresh token
 */
async function getAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Failed to get Google Access Token:', data);
    throw new Error('Could not refresh Google token');
  }
  return data.access_token;
}

/**
 * Uploads a file to Google Drive
 * @param {string} fileName - Name of the file in GDrive
 * @param {string} mimeType - MIME type (e.g. image/jpeg)
 * @param {Buffer|Blob|string} content - File content (Buffer, Blob, or Base64 string)
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadToDrive(fileName, mimeType, content) {
  try {
    const accessToken = await getAccessToken();

    // Convert base64 to buffer if needed
    let bodyData = content;
    if (typeof content === 'string' && content.includes('base64,')) {
      const base64Data = content.split('base64,')[1];
      bodyData = Buffer.from(base64Data, 'base64');
    } else if (typeof content === 'string') {
      bodyData = Buffer.from(content, 'base64');
    }

    // Metadata part
    const metadata = {
      name: fileName,
      parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : [],
    };

    // Multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody = Buffer.concat([
      Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
      Buffer.from(delimiter + 'Content-Type: ' + mimeType + '\r\n\r\n'),
      Buffer.isBuffer(bodyData) ? bodyData : Buffer.from(bodyData),
      Buffer.from(closeDelimiter),
    ]);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': multipartBody.length,
      },
      body: multipartBody,
    });

    const file = await response.json();
    if (!response.ok) {
      console.error('GDrive Upload Error:', file);
      throw new Error('Failed to upload to Google Drive');
    }

    // Set permission to anyone with the link (public)
    await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    // Generate a direct link for viewing
    // The webViewLink works, but for direct embedding, we can use the uc?id= format
    return `https://lh3.googleusercontent.com/d/${file.id}`;
  } catch (error) {
    console.error('Google Drive Error:', error);
    throw error;
  }
}
