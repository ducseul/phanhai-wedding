const TABLES = {
  RSVP: ['id', 'created_at', 'name', 'phone', 'attend', 'guests', 'side', 'events', 'note'],
  'Lời chúc': ['id', 'created_at', 'name', 'message', 'status'],
  'Ảnh khách': ['id', 'created_at', 'name', 'file_id', 'status'],
};
const MAX_PHOTO = 600 * 1024;
const PROPS = PropertiesService.getScriptProperties();
const SHEET_LAYOUT = {
  RSVP: { color: '#80344D', tint: '#FBF0F3', widths: [280, 155, 200, 145, 135, 115, 115, 230, 310],
    headers: ['Mã phản hồi', 'Giờ gửi (VN)', 'Họ và tên', 'Số điện thoại', 'Tham dự', 'Số khách', 'Bên gia đình', 'Lễ tham dự', 'Lời nhắn'] },
  'Lời chúc': { color: '#915332', tint: '#FCF4E9', widths: [280, 155, 210, 520, 145],
    headers: ['Mã lời chúc', 'Giờ gửi (VN)', 'Họ và tên', 'Lời chúc', 'Trạng thái'] },
  'Ảnh khách': { color: '#3B6559', tint: '#ECF5F1', widths: [280, 155, 210, 360, 145],
    headers: ['Mã ảnh', 'Giờ gửi (VN)', 'Họ và tên', 'Mã tệp Google Drive', 'Trạng thái'] },
};

// Safe to run again from the Apps Script editor after updating the source.
function formatWeddingSheets() {
  const book = SpreadsheetApp.openById(PROPS.getProperty('SHEET_ID'));
  book.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  for (const [name, layout] of Object.entries(SHEET_LAYOUT)) {
    const tab = book.getSheetByName(name);
    if (!tab || !tab.getLastRow()) continue;
    const width = layout.headers.length;
    const rows = tab.getMaxRows();
    tab.setTabColor(layout.color).setHiddenGridlines(true).setFrozenRows(1);
    layout.widths.forEach((pixels, index) => tab.setColumnWidth(index + 1, pixels));
    const range = tab.getRange(1, 1, rows, width);
    if (!range.getBandings().length) {
      range.applyRowBanding().setFirstRowColor('#FFFFFF').setSecondRowColor(layout.tint).setHeaderRowColor(layout.color);
    }
    styleHeader_(tab, 1, layout);
    tab.getRange(2, 1, rows - 1, width).setVerticalAlignment('middle').setWrap(true);
    styleDates_(tab.getRange(2, 2, rows - 1));
    if (name === 'RSVP') tab.getRange('D:D').setNumberFormat('@');
    tab.hideColumns(1);
    const status = tab.getRange(2, 5, rows - 1);
    if (name !== 'RSVP') {
      status.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInList(['pending', 'published', 'hidden'], true)
        .setAllowInvalid(false)
        .build());
    }
    const rules = statusRules_(status, name === 'RSVP'
      ? { yes: ['#DCEFE4', '#245340'], no: ['#FBE5E8', '#792C41'] }
      : moderationColors_());
    mergeRules_(tab, rules);
  }
  const qa = book.getSheetByName('Kiểm thử');
  if (qa) formatArchive_(qa);
  SpreadsheetApp.flush();
}

function formatArchive_(tab) {
  if (!tab.getLastRow()) return;
  tab.setTabColor('#777481').setHiddenGridlines(true);
  [280, 155, 180, 325, 125, 100, 125, 195, 310]
    .forEach((pixels, index) => tab.setColumnWidth(index + 1, pixels));
  const labels = Object.keys(SHEET_LAYOUT);
  const titles = () => tab.getRange(1, 1, tab.getLastRow(), 9).getDisplayValues()
    .map((row, index) => ({ name: row[0], row: index + 1, titleOnly: row.slice(1).every((cell) => !cell) }))
    .filter(({ name, titleOnly }) => titleOnly && labels.includes(name));
  for (const { name, row } of titles().reverse()) {
    if (tab.getRange(row + 1, 1).getDisplayValue() !== SHEET_LAYOUT[name].headers[0]) tab.insertRowsAfter(row, 1);
  }
  const sections = titles();
  const rules = [];
  sections.forEach(({ name, row }, index) => {
    const layout = SHEET_LAYOUT[name];
    const width = layout.headers.length;
    tab.getRange(row, 1, 1, width).setBackground(layout.tint).setFontColor(layout.color).setFontWeight('bold');
    tab.setRowHeight(row, 30);
    styleHeader_(tab, row + 1, layout);
    const entries = Math.max(0, (sections[index + 1]?.row || tab.getLastRow() + 1) - row - 2);
    if (!entries) return;
    tab.getRange(row + 2, 1, entries, width).setWrap(true).setVerticalAlignment('middle');
    styleDates_(tab.getRange(row + 2, 2, entries));
    const status = tab.getRange(row + 2, 5, entries);
    rules.push(...statusRules_(status, name === 'RSVP'
      ? { yes: ['#DCEFE4', '#245340'], no: ['#FBE5E8', '#792C41'] }
      : moderationColors_()));
  });
  mergeRules_(tab, rules);
}

function styleHeader_(tab, row, layout) {
  tab.getRange(row, 1, 1, layout.headers.length).setValues([layout.headers])
    .setBackground(layout.color).setFontColor('#FFFFFF').setFontWeight('bold')
    .setWrap(true).setVerticalAlignment('middle');
  tab.setRowHeight(row, 34);
}

function styleDates_(range) {
  range.setNumberFormat('dd/MM/yyyy HH:mm');
  range.getValues().forEach(([value], index) => {
    if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(value) && !isNaN(Date.parse(value))) {
      range.getCell(index + 1, 1).setValue(new Date(value));
    }
  });
}

function moderationColors_() {
  return { pending: ['#FFF0C9', '#684800'], published: ['#DCEFE4', '#245340'], hidden: ['#EBE8EF', '#50465A'] };
}

function statusRules_(range, colors) {
  return Object.entries(colors).map(([value, [background, foreground]]) =>
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(value).setBackground(background)
      .setFontColor(foreground).setRanges([range]).build());
}

function mergeRules_(tab, rules) {
  const existing = tab.getConditionalFormatRules();
  const key = (rule) => {
    const condition = rule.getBooleanCondition();
    if (!condition) return '';
    return JSON.stringify([String(condition.getCriteriaType()), condition.getCriteriaValues(),
      rule.getRanges().map((range) => range.getA1Notation())]);
  };
  const keys = new Set(existing.map(key));
  const additions = rules.filter((rule) => !keys.has(key(rule)));
  if (additions.length) tab.setConditionalFormatRules(existing.concat(additions));
}

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
  }
  const folder = PROPS.getProperty('PHOTO_FOLDER_ID') ||
    DriveApp.createFolder('Thiệp cưới Phan Hải & Thanh Hoài - Ảnh khách').getId();
  PROPS.setProperties({ SHEET_ID: book.getId(), PHOTO_FOLDER_ID: folder });
  formatWeddingSheets();
}

function doGet(e) {
  return respond_(() => {
    const { action, id } = e.parameter;
    if (action === 'health') return { ready: Boolean(PROPS.getProperty('PHOTO_FOLDER_ID')) };
    if (action === 'wishes') {
      return published_('Lời chúc', 200).map((row) => ({
        name: row[2], message: row[3], created_at: row[1] instanceof Date ? row[1].toISOString() : row[1],
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
    const gatewaySecret = PROPS.getProperty('WRITE_GATEWAY_SECRET');
    if (gatewaySecret && !matchesSecret_(gatewaySecret, body && body.gatewaySecret)) {
      reject_('Vui lòng gửi dữ liệu từ trang thiệp.');
    }
    if (!body || !['rsvp', 'wish', 'photo'].includes(body.action)) reject_('Yêu cầu không hợp lệ.');
    const name = clean_(body.name, 60);
    if (!name) reject_('Vui lòng nhập họ tên.');
    const id = Utilities.getUuid();
    const base = [id, new Date(), name];
    if (body.action === 'rsvp') {
      const { attend, side } = body;
      if (!['yes', 'no'].includes(attend) || !['trai', 'gai'].includes(side)) {
        reject_('Vui lòng chọn lời xác nhận và bên gia đình.');
      }
      const events = attend === 'yes' && Array.isArray(body.events)
        ? body.events.slice(0, 5).map((event) => clean_(event, 40)).filter(Boolean).join(', ') : '';
      if (attend === 'yes' && !events) reject_('Vui lòng chọn lễ sẽ tham dự.');
      const guests = attend === 'yes' ? Math.min(20, Math.max(1, parseInt(body.guests, 10) || 1)) : 0;
      const fields = [clean_(body.phone, 20), attend, guests, side, events, clean_(body.note, 300)];
      write_('RSVP', base.concat(fields), fingerprint_([name, ...fields]));
      return null;
    }
    if (body.action === 'wish') {
      const message = clean_(body.message, 500);
      if (message.length < 2) reject_('Vui lòng nhập lời chúc.');
      write_('Lời chúc', base.concat(message, 'pending'), fingerprint_([name, message]));
      return null;
    }
    const jpeg = body.jpeg;
    if (typeof jpeg !== 'string' || jpeg.length > MAX_PHOTO * 4 / 3 ||
        !/^\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(jpeg)) reject_('Ảnh JPEG tối đa 600 KB.');
    const bytes = Utilities.base64Decode(jpeg);
    if (bytes.length > MAX_PHOTO || (bytes[bytes.length - 2] & 255) !== 255 ||
        (bytes[bytes.length - 1] & 255) !== 217) reject_('Ảnh JPEG không hợp lệ.');
    write_('Ảnh khách', base, fingerprint_([name, jpeg]), () => {
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
  return tab.getRange(2, 1, count, 5).getValues().reverse()
    .filter((row) => row[0] && row[4] === 'published').slice(0, limit);
}

function fingerprint_(fields) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, JSON.stringify(fields), Utilities.Charset.UTF_8));
}

function matchesSecret_(expected, candidate) {
  if (typeof candidate !== 'string' || candidate.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) {
    difference |= expected.charCodeAt(index) ^ candidate.charCodeAt(index);
  }
  return difference === 0;
}

function write_(name, values, fingerprint, createFile) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) reject_('Đang có nhiều lượt gửi. Vui lòng thử lại.');
  let file;
  try {
    const cache = CacheService.getScriptCache();
    const duplicate = 'duplicate:' + name + ':' + fingerprint;
    if (cache.get(duplicate)) reject_('Bạn vừa gửi nội dung này. Vui lòng đợi một phút trước khi gửi lại.');
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
    SpreadsheetApp.flush();
    try { cache.put(duplicate, '1', 60); }
    catch (error) { console.error(error.message); }
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
