/* =====================================================================
   FILE CẤU HÌNH THIỆP CƯỚI — CHỈ CẦN SỬA FILE NÀY
   ---------------------------------------------------------------------
   • Các chỗ ghi "SỬA" là thông tin mẫu, hãy thay bằng thông tin thật.
   • Giờ ghi dạng "2026-12-20T11:00:00+07:00" (giữ nguyên +07:00).
   • Lưu file (Cmd + S) rồi tải lại trang là thấy thay đổi.
   ===================================================================== */
window.WEDDING = {
  // ---------- Tên gọi (bìa thiệp, phần đầu, cuối trang) ----------
  groomShort: "Phan Hải",     // SỬA: tên gọi chú rể
  brideShort: "Thanh Hoài",  // SỬA: tên gọi cô dâu

  coverDate: "28 tháng 11, 2026", // SỬA: dòng ngày trên tấm thiệp mở đầu
  coverInvite: "Trân Trọng Kính Mời",
  heroDate: "28 · 11 · 2026",     // SỬA: dòng ngày dưới tên ở đầu trang

  // ---------- Hai bên gia đình ----------
  groomFamily: {
    father: "Phan Đình Chuyên",             // SỬA
    mother: "Phạm Thị Thu",                // SỬA
    address: "Xóm Đà Sơn 2 (X4 cũ) - Đô Lương - Nghệ An",  // SỬA
  },
  brideFamily: {
    father: "Nguyễn Đình Minh",                 // SỬA
    mother: "Nguyễn Thị Hà",                // SỬA
    address: "Xóm Thượng Sơn 4 - Văn Hiến - Nghệ An",  // SỬA
  },

  // ---------- Lời mời ----------
  invitation: [
    "INVITATION",
    "Gửi đến gia đình và bạn bè thân mến,",
    "Cảm ơn bạn đã dành thời gian quý báu để cùng chúng mình chung vui trong ngày đặc biệt này. Chúng mình vô cùng biết ơn vì luôn có sự đồng hành và ủng hộ của bạn, và thật vinh hạnh khi được chia sẻ niềm hạnh phúc của chúng mình cùng bạn.",
    "Trân trọng kính mời bạn đến dự lễ cưới của chúng mình",
  ],

  // ---------- Cô dâu chú rể ----------
  groom: { fullName: "Phan Hải", order: "Trưởng Nam" }, // SỬA
  bride: { fullName: "Thanh Hoài", order: "Trưởng Nữ" },      // SỬA

  // ---------- Các lễ ----------
  // main: true  → lễ chính, nằm trong khung đầu tiên cùng thông tin gia đình
  // lễ còn lại  → khung thứ hai, kèm đồng hồ đếm ngược + lịch + nút xác nhận
  // Đồng hồ đếm ngược tự chọn lễ gần nhất chưa diễn ra.
  events: [
    {
      id: "thanh-hon",
      main: true,
      panelTitle: "Thông tin lễ thành hôn",
      title: "Lễ thành hôn", // tên ngắn, dùng cho lịch / đếm ngược
      heading: "Lễ thành hôn được tổ chức tại Khách Sạn Anh Thanh ĐÔ",
      start: "2026-11-28T11:00:00+07:00", // SỬA
      end: "2026-11-28T14:00:00+07:00",   // SỬA
      lunar: "(Tức ngày 20 tháng 10 năm Bính Ngọ)", // SỬA
      address: "Tư gia nhà trai, Thôn ..., xã ..., tỉnh ...", // SỬA (dùng cho lịch)
    },
    // {
    //   id: "vu-quy",
    //   panelTitle: "Thông tin lễ thành hôn",
    //   title: "Lễ thành hôn",
    //   heading: "Trân trọng kính mời quý khách tới dự lễ thành hôn",
    //   start: "2026-11-28T11:00:00+07:00", // SỬA
    //   end: "2026-11-28T14:00:00+07:00",   // SỬA
    //   lunar: "(Tức ngày 20 tháng 10 năm Bính Ngọ)", // SỬA
    //   address: "Tư gia nhà gái, Thôn ..., xã ..., tỉnh ...", // SỬA
    // },
  ],

  // ---------- Địa điểm tiệc + bản đồ ----------
  venue: {
    title: "Tiệc cưới tổ chức tại Khách Sạn Anh Thanh ĐÔ (Sảnh lớn)", // SỬA
    address: "KĐT Vườn Xanh - Đô Lương - Nghệ An",          // SỬA
    // Google Maps → nhấn giữ đúng vị trí → copy 2 con số tọa độ
    lat: 18.89193670545385,  // SỬA
    lng: 105.30955509585445, // SỬA
  },

  // ---------- Ảnh ----------
  // Album tự đọc từ images/gallery.json (lệnh `npm run anh` tạo ra).
  envelopeImage: "/images/phong-bi.webp", // ảnh trong phong bì đầu trang (ảnh dọc)
  closingImage: "/images/cuoi-trang.webp", // ảnh cuối trang (dọc 4:5)

  // ---------- Nhạc nền ----------
  music: "/music/nhac.mp3", // bỏ file vào public/music/ đúng tên này
  musicStart: 0,            // phát từ giây thứ mấy (vd 12 = bỏ 12 giây dạo đầu)

  // ---------- Hộp quà mừng ----------
  // bankBin (mã VietQR): Vietcombank 970436, MB 970422, Techcombank 970407,
  // BIDV 970418, VietinBank 970415, Agribank 970405, ACB 970416,
  // VPBank 970432, TPBank 970423, Sacombank 970403, VIB 970441.
  // qrImage: (không bắt buộc) ảnh QR chụp từ app ngân hàng, bỏ vào public/qr/ rồi ghi "/qr/ten-file.png".
  //          Để trống "" thì thiệp tự tạo mã QR từ bankBin + accountNo.
  gifts: [
    { who: "Chú rể", owner: "Phan Triệu Hải", bankName: "BIDV", bankBin: "970418", accountNo: "8808539868", qrImage: "/qr/chu-re.jpg" },
    { who: "Cô dâu", owner: "Nguyễn Thị Hoài", bankName: "VietinBank", bankBin: "970415", accountNo: "105870598961", qrImage: "/qr/co-dau.jpg" },
  ],

  // ---------- Lời chúc gợi ý (nút đũa phép trong sổ lưu bút) ----------
  suggestions: [
    "Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long!",
    "Chúc mừng hạnh phúc hai bạn. Mãi yêu thương nhau như ngày đầu nhé!",
    "Chúc cô dâu chú rể sớm sinh quý tử, gia đình luôn ấm êm, rộn tiếng cười.",
    "Chúc hai bạn luôn nắm tay nhau đi qua mọi nắng mưa của cuộc đời.",
    "Chúc mừng đám cưới! Chúc tổ ấm mới luôn tràn ngập yêu thương và bình an.",
    "Chúc vợ chồng son luôn hạnh phúc, thuận vợ thuận chồng tát biển Đông cũng cạn.",
    "Trăm năm tình viên mãn, bạc đầu nghĩa phu thê. Chúc mừng hai bạn!",
  ],

  // ---------- Tính năng ----------
  features: {
    rsvp: true,
    guestbook: true,
    map: true, // bản đồ nhúng phía trên nút Chỉ đường
    // "drive" = ảnh khách qua Apps Script | "link" = Google Photos | false = ẩn
    guestPhotos: "drive",
    guestPhotosLink: "https://photos.app.goo.gl/...",
  },

  sheetsEndpoint: "https://script.google.com/macros/s/AKfycbyhg4v1_zrO048IjklDIF7EvT8-DX_JDztAZvCoXNdxC3v_fwbf_ivyeASBu_9mfJQ-/exec",
  submitEndpoint: "https://phanhai-wedding-submit.phanhai-thanhhoai-io-vn.workers.dev/submit",
  closingText: "Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!",
};
