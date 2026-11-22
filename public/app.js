/* Thiệp cưới — logic giao diện. Thông tin lấy từ config.js, thường không cần sửa file này. */
(() => {
  const C = window.WEDDING;
  const TZ = "Asia/Ho_Chi_Minh";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HEART = '<svg viewBox="0 0 40 36" aria-hidden="true"><use href="#heart"/></svg>';

  // Ngày giờ theo giờ Việt Nam
  function parts(d) {
    const f = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", weekday: "long", hour12: false });
    const o = Object.fromEntries(f.formatToParts(new Date(d)).map((p) => [p.type, p.value]));
    const wd = o.weekday.replace(/^\w/, (c) => c.toUpperCase()).replace(/ (\w)/g, (m, c) => " " + c.toUpperCase());
    return { day: +o.day, month: +o.month, year: +o.year, hour: o.hour, minute: o.minute, weekday: wd };
  }
  // Kiểm tra ngày giờ trong config.js: sai định dạng thì báo lỗi đỏ, không làm hỏng cả trang
  const okDate = (v) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?\+07:00$/.test(v || "") && !isNaN(new Date(v));
  const bad = C.events.filter((e) => !okDate(e.start) || !okDate(e.end));
  if (bad.length) {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99;background:#b3261e;color:#fff;padding:10px 14px;font:14px/1.5 system-ui;white-space:pre-line";
    box.textContent = "Lỗi trong config.js — ngày giờ sai định dạng ở: " + bad.map((e) => `"${e.title}" (start: ${e.start} / end: ${e.end})`).join(", ") + "\nĐúng mẫu: \"2026-11-28T11:00:00+07:00\"";
    document.body.appendChild(box);
  }
  const valid = C.events.filter((e) => !bad.includes(e));
  const events = (valid.length ? valid : [{ ...C.events[0], start: new Date().toISOString(), end: new Date().toISOString() }])
    .map((e) => ({ ...e, s: new Date(e.start), e: new Date(e.end), p: parts(e.start) }));

  // ---------- Toast ----------
  const toastEl = $("#toast"); let toastT;
  const toast = (t) => { toastEl.textContent = t; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2200); };

  // ---------- Chữ đơn giản ----------
  $$("[data-f]").forEach((el) => (el.textContent = C[el.dataset.f] ?? ""));
  document.title = `${C.groomShort} & ${C.brideShort} | Thiệp cưới`;

  // Tên khách mời: link ?to=Anh%20Tuấn
  const guest = (new URLSearchParams(location.search).get("to") || "").trim();
  if (guest) { $("#cover-guest").textContent = guest; $("#cover-guest").hidden = false; }

  // ---------- Ảnh ----------
  $("#env-img").src = C.envelopeImage;
  $("#thanks-img").src = C.closingImage;
  $("#thanks-line").textContent = C.closingText;

  // ---------- Khung 1 ----------
  const main = events.find((e) => e.main) || events[0];
  const others = events.filter((e) => e !== main);
  const fam = (label, f) => `<p class="family-label">${label}</p><p class="family-name">${esc(f.father)}</p><p class="family-name">${esc(f.mother)}</p><p class="family-addr">${esc(f.address)}</p>`;
  $("#main-title").textContent = main.panelTitle;
  $("#fam-groom").innerHTML = fam("Nhà Trai", C.groomFamily);
  $("#fam-bride").innerHTML = fam("Nhà Gái", C.brideFamily);
  $("#announce").innerHTML = esc(C.announce).replace(/\n/g, "<br>");
  $("#groom-full").textContent = C.groom.fullName;
  $("#groom-order").textContent = C.groom.order;
  $("#bride-full").textContent = C.bride.fullName;
  $("#bride-order").textContent = C.bride.order;
  const eventHTML = (e) => `<div class="event-block">
      <p class="event-heading">${esc(e.heading)}</p>
      <div class="event-date">
        <p class="event-time">Vào lúc ${e.p.hour}:${e.p.minute}<span class="dot"></span>${esc(e.p.weekday)}</p>
        <div class="event-day"><span class="day">${pad(e.p.day)}</span><span class="bar"></span><span class="mon"><span>Tháng ${pad(e.p.month)}</span><span>${e.p.year}</span></span></div>
        <p class="lunar">${esc(e.lunar)}</p>
      </div></div>`;
  $("#main-event").innerHTML = eventHTML(main);

  // ---------- Khung 2 ----------
  $("#second-title").textContent = others.length ? others[0].panelTitle : "Cùng đếm ngược ngày vui";
  $("#other-events").innerHTML = others.map(eventHTML).join("");

  // Đếm ngược tới lễ gần nhất chưa kết thúc
  const sorted = [...events].sort((a, b) => a.s - b.s);
  const cd = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
  const label = $("#countdown-label");
  function tick() {
    const now = new Date();
    const t = sorted.find((e) => e.e > now);
    if (!t) { label.textContent = "Cảm ơn quý khách đã chung vui cùng gia đình!"; Object.values(cd).forEach((x) => (x.textContent = "00")); return; }
    if (now >= t.s) { label.textContent = `${t.title} đang diễn ra`; Object.values(cd).forEach((x) => (x.textContent = "00")); return; }
    label.textContent = `Cùng đếm ngược tới ${t.title.toLowerCase()}`;
    let s = Math.floor((t.s - now) / 1000);
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    cd.d.textContent = pad(d); cd.h.textContent = pad(h); cd.m.textContent = pad(Math.floor(s / 60)); cd.s.textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  // Lịch tháng (tháng của lễ sớm nhất)
  (() => {
    const p0 = sorted[0].p;
    const marks = Object.fromEntries(events.filter((e) => e.p.month === p0.month && e.p.year === p0.year).map((e) => [e.p.day, e.title]));
    const offset = (new Date(Date.UTC(p0.year, p0.month - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(p0.year, p0.month, 0)).getUTCDate();
    $("#calendar-title").textContent = `Tháng ${p0.month} / ${p0.year}`;
    let h = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => `<span class="dow">${d}</span>`).join("") + "<span></span>".repeat(offset);
    for (let d = 1; d <= days; d++) h += marks[d] ? `<span class="mark" title="${esc(marks[d])}">${HEART}<b>${d}</b></span>` : `<span>${d}</span>`;
    $("#calendar-grid").innerHTML = h;
    $("#calendar-legend").innerHTML = sorted.filter((e) => marks[e.p.day]).map((e) => `<span><i></i>${e.p.day} · ${esc(e.title)}</span>`).join("");
  })();

  // Thêm vào lịch
  const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const names = `${C.groomShort} & ${C.brideShort}`;
  const gcal = (e) => "https://calendar.google.com/calendar/render?" + new URLSearchParams({ action: "TEMPLATE", text: `${e.title} ${names}`, dates: `${utc(e.s)}/${utc(e.e)}`, details: `${e.heading}. ${location.origin}`, location: e.address || C.venue.address, ctz: TZ });
  function downloadIcs() {
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//thiep-cuoi//VI", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    sorted.forEach((e) => L.push("BEGIN:VEVENT", `UID:${e.id}@thiep-cuoi`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(e.s)}`, `DTEND:${utc(e.e)}`, `SUMMARY:${e.title} ${names}`, `LOCATION:${(e.address || C.venue.address).replace(/[,;]/g, "\\$&")}`, `DESCRIPTION:${location.origin}`, "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Nhắc lịch", "END:VALARM", "END:VEVENT"));
    L.push("END:VCALENDAR");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([L.join("\r\n")], { type: "text/calendar" }));
    a.download = "thiep-cuoi.ics"; a.click();
  }
  const menu = $("#addcal-menu"), calBtn = $("#addcal-btn");
  menu.innerHTML = sorted.map((e) => `<a href="${gcal(e)}" target="_blank" rel="noopener">Google Lịch · ${esc(e.title)}</a>`).join("") + `<button type="button" id="ics-btn">iPhone, Outlook · ${sorted.length > 1 ? "Cả hai lễ" : esc(sorted[0].title)}</button>`;
  calBtn.onclick = () => { const open = menu.hidden; menu.hidden = !open; calBtn.setAttribute("aria-expanded", String(open)); };
  $("#ics-btn").onclick = downloadIcs;

  // ---------- Địa điểm ----------
  const { lat, lng } = C.venue;
  $("#venue-title").textContent = C.venue.title;
  $("#venue-addr").textContent = C.venue.address;
  $("#venue-link").href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  if (C.features.map) $("#map").innerHTML = `<iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=16&hl=vi&output=embed" title="Bản đồ địa điểm" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  else $("#map").hidden = true;

  // ---------- Hiệu ứng hiện dần ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  const watchReveal = () => $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  watchReveal();

  // ---------- Album + xem ảnh ----------
  const lb = $("#lightbox"), lbImg = $(".lb-img", lb), lbCount = $(".lb-count", lb);
  let gallery = [], lbIndex = 0, slideTo = () => {};
  function lbShow(i) {
    const n = gallery.length; lbIndex = (i + n) % n;
    lbImg.style.opacity = ".3";
    const im = new Image(); im.onload = () => { lbImg.src = im.src; lbImg.style.opacity = "1"; }; im.src = gallery[lbIndex].f;
    lbCount.textContent = `${lbIndex + 1} / ${n}`;
    [1, -1].forEach((k) => (new Image().src = gallery[(lbIndex + k + n) % n].f));
  }
  const lbOpen = (i) => { lb.hidden = false; document.documentElement.classList.add("locked"); lbShow(i); };
  const lbClose = () => { lb.hidden = true; document.documentElement.classList.remove("locked"); slideTo(lbIndex); };
  $(".lb-close", lb).onclick = lbClose;
  $(".lb-nav.prev", lb).onclick = () => lbShow(lbIndex - 1);
  $(".lb-nav.next", lb).onclick = () => lbShow(lbIndex + 1);
  lb.addEventListener("click", (e) => e.target === lb && lbClose());
  document.addEventListener("keydown", (e) => { if (lb.hidden) return; if (e.key === "Escape") lbClose(); if (e.key === "ArrowLeft") lbShow(lbIndex - 1); if (e.key === "ArrowRight") lbShow(lbIndex + 1); });
  let tx = null;
  lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 45) lbShow(lbIndex + (dx < 0 ? 1 : -1)); tx = null; });

  fetch("/images/gallery.json").then((r) => (r.ok ? r.json() : [])).catch(() => []).then((list) => {
    gallery = list;
    if (!list.length) { $("#album").hidden = true; return; }
    const car = $("#carousel"), dots = $("#dots");
    car.innerHTML = list.map((p, i) => `<button class="slide" type="button" data-index="${i}" aria-label="Xem ảnh ${i + 1}"><img src="${p.s}" loading="${i < 2 ? "eager" : "lazy"}" decoding="async" alt=""></button>`).join("");
    dots.innerHTML = list.map((_, i) => `<span class="${i ? "" : "on"}"></span>`).join("");
    // Lưới ảnh nhỏ: 6 ảnh đầu + ô "+N"
    const showN = Math.min(list.length, 7);
    $("#thumbs").innerHTML = list.slice(0, showN).map((p, i) => {
      const more = list.length - 6;
      if (i === 6 && more > 0) return `<button class="thumb more" type="button" data-index="6" aria-label="Xem toàn bộ album"><img src="${p.s}" loading="lazy" alt=""><span>+${more}</span></button>`;
      return `<button class="thumb" type="button" data-index="${i}" aria-label="Xem ảnh ${i + 1}"><img src="${p.s}" loading="lazy" alt=""></button>`;
    }).join("");
    $$("#album [data-index]").forEach((b) => (b.onclick = () => lbOpen(+b.dataset.index)));

    const slides = $$(".slide", car), dotEls = $$("span", dots);
    let cur = 0;
    const setActive = (i) => { cur = i; slides.forEach((s, k) => s.classList.toggle("active", k === i)); dotEls.forEach((d, k) => d.classList.toggle("on", k === i)); };
    const sio = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(slides.indexOf(e.target))), { root: car, threshold: 0.6 });
    slides.forEach((s) => sio.observe(s));
    setActive(0);
    slideTo = (i) => { const s = slides[(i + slides.length) % slides.length]; car.scrollTo({ left: s.offsetLeft - (car.clientWidth - s.clientWidth) / 2, behavior: reduced ? "auto" : "smooth" }); };
    // Tự chuyển ảnh mỗi 4 giây khi album đang hiện trên màn hình
    let visible = false, touched = 0;
    new IntersectionObserver((es) => (visible = es[0].isIntersecting), { threshold: 0.4 }).observe(car);
    ["pointerdown", "touchstart", "wheel"].forEach((ev) => car.addEventListener(ev, () => (touched = Date.now()), { passive: true }));
    if (!reduced) setInterval(() => { if (visible && Date.now() - touched > 6000 && lb.hidden) slideTo(cur + 1); }, 4000);
    watchReveal();
  });

  // ---------- Nhạc ----------
  const audio = $("#bgm"), mBtn = $("#music-btn");
  let hasMusic = false, userPaused = false;
  const setPlaying = (on) => { mBtn.classList.toggle("playing", on); mBtn.setAttribute("aria-label", on ? "Tắt nhạc" : "Bật nhạc"); };
  const play = () => hasMusic && audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  if (C.music) fetch(C.music, { method: "HEAD" }).then((r) => {
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !type.startsWith("audio")) return;
    hasMusic = true; audio.src = C.music; audio.preload = "auto"; mBtn.hidden = false;
    // Bắt đầu phát từ giây thứ musicStart (bỏ đoạn dạo đầu), chỉ áp dụng lần đầu
    if (C.musicStart > 0) audio.addEventListener("loadedmetadata", () => { if (audio.currentTime < 1) audio.currentTime = C.musicStart; }, { once: true });
    if (!$("#cover")) play();
  }).catch(() => {});
  mBtn.onclick = () => { if (audio.paused) { userPaused = false; play(); } else { userPaused = true; audio.pause(); setPlaying(false); } };
  document.addEventListener("visibilitychange", () => { if (!hasMusic) return; if (document.hidden) audio.pause(); else if (!userPaused && !$("#cover")) play(); });

  // ---------- Màn mở thiệp ----------
  const cover = $("#cover"), hearts = $(".cover-hearts");
  for (let i = 0; i < 18; i++) {
    const h = document.createElement("i");
    h.style.left = `${Math.random() * 100}%`;
    h.style.setProperty("--s", `${8 + Math.random() * 14}px`);
    h.style.setProperty("--d", `${7 + Math.random() * 7}s`);
    h.style.setProperty("--delay", `${-Math.random() * 12}s`);
    h.style.setProperty("--x", `${(Math.random() - 0.5) * 120}px`);
    hearts.appendChild(h);
  }
  $("#open-btn").onclick = () => {
    play();
    cover.classList.add("opening");
    document.documentElement.classList.remove("locked");
    scrollTo(0, 0);
    setTimeout(() => $("#envelope").classList.add("in"), 500);
    setTimeout(() => cover.remove(), 1400);
  };

  // ---------- Hộp thoại ----------
  $$("[data-open]").forEach((b) => (b.onclick = () => document.getElementById(b.dataset.open).showModal()));
  $$("dialog").forEach((d) => {
    $$("[data-close]", d).forEach((b) => (b.onclick = () => d.close()));
    d.addEventListener("click", (e) => e.target === d && d.close());
  });

  const msg = (el, t, err = false) => { el.textContent = t; el.classList.toggle("error", err); };

  // ---------- Xác nhận tham dự ----------
  const rsvpDlg = $("#rsvp-dialog"), form = $("#rsvp-form"), rMsg = $(".form-msg", form), attendOnly = $(".attend-only", form);
  if (!C.features.rsvp) $("#rsvp-open").hidden = true;
  $("#rsvp-events").innerHTML = sorted.map((e) => `<label><input type="checkbox" name="events" value="${esc(e.id)}" checked> ${esc(e.title)} · ${e.p.hour}:${e.p.minute} ${esc(e.p.weekday)} ${pad(e.p.day)}/${pad(e.p.month)}</label>`).join("");
  $("#rsvp-guests").innerHTML = Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1} người</option>`).join("");
  if (guest) form.name.value = guest;
  form.addEventListener("change", () => (attendOnly.hidden = form.attend.value !== "yes"));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const yes = form.attend.value === "yes";
    const data = { name: form.name.value, side: form.side.value, attend: form.attend.value, events: $$("input[name=events]:checked", form).map((x) => x.value), guests: form.guests.value, phone: form.phone.value, note: form.note.value };
    if (!data.name.trim()) return msg(rMsg, "Vui lòng nhập họ tên", true);
    if (!data.side) return msg(rMsg, "Vui lòng chọn nhà trai hoặc nhà gái", true);
    if (yes && !data.events.length) return msg(rMsg, "Vui lòng chọn lễ quý khách sẽ tham dự", true);
    const btn = $("button[type=submit]", form); btn.disabled = true; msg(rMsg, "Đang gửi...");
    try {
      await window.weddingApi("rsvp", data);
      $("#rsvp-done-text").textContent = yes ? "Gia đình rất vui được đón tiếp quý khách. Hẹn gặp quý khách tại buổi lễ!" : "Cảm ơn quý khách đã báo tin. Gia đình luôn trân trọng tình cảm của quý khách.";
      form.hidden = true; $(".sheet-done", rsvpDlg).hidden = false; form.reset(); attendOnly.hidden = false; msg(rMsg, "");
    } catch (err) { msg(rMsg, err.message, true); }
    finally { btn.disabled = false; }
  });
  rsvpDlg.addEventListener("close", () => { form.hidden = false; $(".sheet-done", rsvpDlg).hidden = true; });

  // ---------- Sổ lưu bút ----------
  const wForm = $("#wish-form"), wMsg = $("#wish-msg"), wList = $("#wishes");
  const fmt = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  function wishEl(w) {
    const li = document.createElement("li");
    li.innerHTML = `<div class="w-head"><span class="w-name"></span><span class="w-time"></span></div><p class="w-msg"></p>`;
    $(".w-name", li).textContent = w.name;
    const createdAt = new Date(w.created_at);
    $(".w-time", li).textContent = Number.isNaN(createdAt.getTime()) ? "" : fmt.format(createdAt);
    $(".w-msg", li).textContent = w.message;
    return li;
  }
  const emptyEl = () => { const li = document.createElement("li"); li.className = "empty"; li.textContent = "Hãy là người đầu tiên gửi lời chúc nhé!"; return li; };
  async function loadWishes() {
    try {
      const list = await window.weddingApi("wishes");
      wList.replaceChildren(...(list.length ? list.map(wishEl) : [emptyEl()]));
    } catch (error) {
      const status = emptyEl();
      status.textContent = error.message;
      wList.replaceChildren(status);
    }
  }
  if (!C.features.guestbook) $("#guestbook").hidden = true;
  else new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { loadWishes(); o.disconnect(); } }, { rootMargin: "600px 0px" }).observe(wList);
  if (guest) wForm.name.value = guest;
  let lastSug = -1;
  $("#wish-suggest").onclick = () => {
    const s = C.suggestions || []; if (!s.length) return;
    let i; do i = Math.floor(Math.random() * s.length); while (i === lastSug && s.length > 1);
    lastSug = i; wForm.message.value = s[i];
  };
  wForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = { name: wForm.name.value, message: wForm.message.value };
    if (!body.name.trim()) return msg(wMsg, "Vui lòng nhập tên của bạn", true);
    if (body.message.trim().length < 2) return msg(wMsg, "Vui lòng nhập lời chúc", true);
    const btn = $("button[type=submit]", wForm); btn.disabled = true; msg(wMsg, "Đang gửi...");
    try {
      await window.weddingApi("wish", body);
      wForm.message.value = ""; msg(wMsg, "Cảm ơn bạn! Lời chúc sẽ hiển thị sau khi được duyệt.");
    } catch (err) { msg(wMsg, err.message, true); }
    finally { btn.disabled = false; }
  });

  // ---------- Ảnh khách gửi ----------
  const gp = C.features.guestPhotos;
  if (!gp) $("#moments").hidden = true;
  else if (gp === "link") ["#send-photo", "#view-album"].forEach((s) => { $(s).href = C.features.guestPhotosLink; $(s).target = "_blank"; });

  // ---------- Hộp quà ----------
  // Ảnh QR: nếu điền qrImage (ảnh QR chụp từ app ngân hàng, bỏ trong public/qr/) thì dùng ảnh đó,
  // nếu để trống thì tự tạo mã VietQR từ bankBin + accountNo.
  const qrSrc = (g) => g.qrImage || `https://img.vietqr.io/image/${g.bankBin}-${g.accountNo}-compact2.png?accountName=${encodeURIComponent(g.owner)}&addInfo=${encodeURIComponent(`Mung cuoi ${C.groomShort} ${C.brideShort}`)}`;
  const gifts = C.gifts || [];
  const cardsEl = $("#gift-cards"), tabsEl = $("#gift-tabs");
  cardsEl.innerHTML = gifts.map((g, i) => `<div class="gift-card" data-gift="${i}" ${i ? "hidden" : ""}>
      <p class="gift-who">${esc(g.who)}</p>
      <div class="qr-frame"><i></i><i></i><i></i><i></i><img src="${esc(qrSrc(g))}" alt="Mã QR tài khoản ${esc(g.owner)}" loading="lazy"></div>
      <p class="gift-owner">${esc(g.owner)}</p>
      <p class="gift-bank">${esc(g.bankName)}</p>
      <div class="gift-number"><span>${esc(g.accountNo)}</span><button type="button" class="copy-btn" data-copy="${esc(g.accountNo)}">Sao chép</button></div>
      <button type="button" class="btn btn-wine gift-save" data-save="${i}">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.4l3.3 3.3V4a1 1 0 0 1 1-1ZM5 19h14a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2Z"/></svg>
        Lưu mã QR</button>
    </div>`).join("");
  if (gifts.length > 1) {
    tabsEl.innerHTML = gifts.map((g, i) => `<button type="button" role="tab" class="${i ? "" : "on"}" data-tab="${i}">${esc(g.who)}</button>`).join("");
    tabsEl.onclick = (e) => {
      const t = e.target.closest("[data-tab]"); if (!t) return;
      $$("[data-tab]", tabsEl).forEach((b) => b.classList.toggle("on", b === t));
      $$("[data-gift]", cardsEl).forEach((c) => (c.hidden = c.dataset.gift !== t.dataset.tab));
    };
  } else tabsEl.hidden = true;
  $$("[data-copy]").forEach((b) => (b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); }
    catch { const t = document.createElement("textarea"); t.value = b.dataset.copy; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    toast("Đã sao chép số tài khoản");
  }));
  $$("[data-save]").forEach((b) => (b.onclick = async () => {
    const g = gifts[+b.dataset.save], url = qrSrc(g), name = `QR-mung-cuoi-${g.who}.png`.replace(/\s+/g, "-");
    try {
      const blob = await fetch(url).then((r) => { if (!r.ok) throw 0; return r.blob(); });
      const file = new File([blob], name, { type: blob.type || "image/png" });
      // Điện thoại: mở bảng chia sẻ để "Lưu hình ảnh"; máy tính: tải file
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
      toast("Đã lưu mã QR");
    } catch (err) {
      if (err?.name === "AbortError") return;
      window.open(url, "_blank"); toast("Nhấn giữ vào ảnh để lưu");
    }
  }));
})();
