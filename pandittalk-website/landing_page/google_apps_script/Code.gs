/**
 * PanditTalk — "Notify Me" → Google Sheet
 *
 * SETUP (you do this once in Google — ~5 minutes):
 *
 * 1. Create a Google Sheet: https://sheets.google.com
 *    Name it e.g. "PanditTalk Notify List"
 *    In Sheet1, put headers in row 1:  Timestamp | Email | Source
 *
 * 2. Extensions → Apps Script
 *    Delete any default code and paste THIS entire file.
 *
 * 3. In the script editor, set SHEET_NAME if your tab is not "Sheet1".
 *
 * 4. Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    Click Deploy → Authorize with your Google account
 *    Copy the Web app URL
 *
 * 5. Paste that URL into landing_page/script.js as NOTIFY_SHEET_URL
 *
 * 6. Reload the landing page and test "Notify Me"
 */

var SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    var email = String(body.email || '').trim().toLowerCase();
    var source = String(body.source || 'landing_page').trim();

    if (!email || email.indexOf('@') === -1) {
      return jsonResponse_({ ok: false, error: 'Invalid email' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse_({ ok: false, error: 'Sheet tab not found: ' + SHEET_NAME });
    }

    // Skip exact duplicates
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      var emails = sheet.getRange(2, 2, lastRow, 2).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).toLowerCase() === email) {
          return jsonResponse_({ ok: true, duplicate: true });
        }
      }
    }

    sheet.appendRow([new Date(), email, source]);
    return jsonResponse_({ ok: true, duplicate: false });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'PanditTalk Notify Me endpoint is live. Use POST with JSON { "email": "..." }',
  });
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
