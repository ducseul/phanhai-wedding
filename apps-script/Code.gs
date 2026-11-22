const TABLES = {
  RSVP: ['id', 'created_at', 'name', 'phone', 'attend', 'guests', 'side', 'events', 'note'],
  'Lời chúc': ['id', 'created_at', 'name', 'message', 'status'],
  'Ảnh khách': ['id', 'created_at', 'name', 'file_id', 'status'],
};
const MAX_PHOTO = 600 * 1024;
const PROPS = PropertiesService.getScriptProperties();

// Set SHEET_ID in project properties, then run once before deploying.
function setup() {
  const sheetId = PROPS.getProperty('SHEET_ID');
  if (!sheetId) throw new Error('Thiếu SHEET_ID trong thuộc tính tập lệnh.');
  const book = SpreadsheetApp.openById(sheetId);
  book.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  for (const [name, columns] of Object.entries(TABLES)) {
    const tab = book.getSheetByName(name) || book.insertSheet(name);
    if (tab.getLastRow()) continue;
    tab.getRange(1, 1, 1, columns.length).setValues([columns]).setFontWeight('bold');
    tab.setFrozenRows(1);
    if (name === 'RSVP') tab.getRange('D:D').setNumberFormat('@');
    if (name !== 'RSVP') {
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['pending', 'published', 'hidden'], true)
        .setAllowInvalid(false)
        .build();
      tab.getRange(2, columns.length, tab.getMaxRows() - 1, 1).setDataValidation(rule);
    }
  }
  const folder = PROPS.getProperty('PHOTO_FOLDER_ID') ||
    DriveApp.createFolder('Thiệp cưới Phan Hải & Thanh Hoài - Ảnh khách').getId();
  PROPS.setProperties({ SHEET_ID: book.getId(), PHOTO_FOLDER_ID: folder });
}

function doGet(e) {
  return respond_(() => {
    const { action, id } = e.parameter;
    if (action === 'health') return { ready: Boolean(PROPS.getProperty('PHOTO_FOLDER_ID')) };
    if (action === 'wishes') {
      return published_('Lời chúc', 200).map((row) => ({
        name: row[2], message: row[3], created_at: row[1],
      }));
    }
    if (action === 'photos') {
      return published_('Ảnh khách', 60).map((row) => ({ id: row[0], name: row[2] }));
    }
    if (action === 'photo' && /^[a-f0-9-]{36}$/.test(id || '')) {
      const row = published_('Ảnh khách', 60).find((item) => item[0] === id);
      if (!row) reject_('Không tìm thấy ảnh.');
      const file = DriveApp.getFileById(row[3]);
      if (file.getMimeType() !== 'image/jpeg' || file.getSize() > MAX_PHOTO) {
        reject_('Ảnh không hợp lệ.');
      }
      return { jpeg: Utilities.base64Encode(file.getBlob().getBytes()) };
    }
    reject_('Yêu cầu không hợp lệ.');
  });
}

function doPost(e) {
  return respond_(() => {
    const raw = e.postData && e.postData.contents;
    if (!raw || raw.length > MAX_PHOTO * 4 / 3 + 1024) reject_('Dữ liệu gửi không hợp lệ.');
    let body;
    try { body = JSON.parse(raw); } catch (_) { reject_('Dữ liệu gửi không hợp lệ.'); }
    if (!body || !['rsvp', 'wish', 'photo'].includes(body.action)) reject_('Yêu cầu không hợp lệ.');
    const name = clean_(body.name, 60);
    if (!name) reject_('Vui lòng nhập họ tên.');
    const id = Utilities.getUuid();
    const base = [id, new Date().toISOString(), name];
    if (body.action === 'rsvp') {
      const { attend, side } = body;
      if (!['yes', 'no'].includes(attend) || !['trai', 'gai'].includes(side)) {
        reject_('Vui lòng chọn lời xác nhận và bên gia đình.');
      }
      const events = attend === 'yes' && Array.isArray(body.events)
        ? body.events.slice(0, 5).map((event) => clean_(event, 40)).filter(Boolean).join(', ') : '';
      if (attend === 'yes' && !events) reject_('Vui lòng chọn lễ sẽ tham dự.');
      const guests = attend === 'yes' ? Math.min(20, Math.max(1, parseInt(body.guests, 10) || 1)) : 0;
      write_('RSVP', base.concat(clean_(body.phone, 20), attend, guests, side, events, clean_(body.note, 300)));
      return null;
    }
    if (body.action === 'wish') {
      const message = clean_(body.message, 500);
      if (message.length < 2) reject_('Vui lòng nhập lời chúc.');
      write_('Lời chúc', base.concat(message, 'pending'));
      return null;
    }
    const jpeg = body.jpeg;
    if (typeof jpeg !== 'string' || jpeg.length > MAX_PHOTO * 4 / 3 ||
        !/^\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(jpeg)) reject_('Ảnh JPEG tối đa 600 KB.');
    const bytes = Utilities.base64Decode(jpeg);
    if (bytes.length > MAX_PHOTO || (bytes[bytes.length - 2] & 255) !== 255 ||
        (bytes[bytes.length - 1] & 255) !== 217) reject_('Ảnh JPEG không hợp lệ.');
    write_('Ảnh khách', base, () => {
      const folder = DriveApp.getFolderById(PROPS.getProperty('PHOTO_FOLDER_ID'));
      const file = folder.createFile(Utilities.newBlob(bytes, 'image/jpeg', id + '.jpg'));
      return file;
    });
    return null;
  });
}

function sheet_(name) {
  return SpreadsheetApp.openById(PROPS.getProperty('SHEET_ID')).getSheetByName(name);
}

function published_(name, limit) {
  const tab = sheet_(name);
  const count = tab.getLastRow() - 1;
  if (count < 1) return [];
  return tab.getRange(2, 1, count, 5).getDisplayValues().reverse()
    .filter((row) => row[0] && row[4] === 'published').slice(0, limit);
}

function write_(name, values, createFile) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) reject_('Đang có nhiều lượt gửi. Vui lòng thử lại.');
  let file;
  try {
    const cache = CacheService.getScriptCache();
    const bucket = 'writes:' + name + ':' + Math.floor(Date.now() / 60000);
    const count = Number(cache.get(bucket) || 0);
    if (count >= (createFile ? 50 : 100)) reject_('Đang có nhiều lượt gửi. Vui lòng thử lại.');
    cache.put(bucket, String(count + 1), 120);
    const tab = sheet_(name);
    if (createFile) {
      file = createFile();
      values = values.concat(file.getId(), 'pending');
    }
    tab.appendRow(values.map((value) =>
      typeof value === 'string' && /^[=+\-@'\t\r\n]/.test(value) ? "'" + value : value));
  } catch (error) {
    if (file) file.setTrashed(true);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function clean_(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function reject_(message) {
  const error = new Error(message);
  error.publicMessage = message;
  throw error;
}

function respond_(operation) {
  let result;
  try { result = { ok: true, data: operation() }; }
  catch (error) {
    if (!error.publicMessage) console.error(error.message);
    result = { ok: false, error: error.publicMessage || 'Chưa thể xử lý. Vui lòng thử lại sau.' };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
