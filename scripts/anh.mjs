// Xử lý ảnh: đọc ảnh gốc trong thư mục anh-goc/ → xuất WebP vào public/images/
//
// Quy ước tên file trong anh-goc/:
//   bia.jpg        → ảnh bìa (hero)            → public/images/bia.webp
//   phong-bi.jpg   → ảnh trong phong bì         → public/images/phong-bi.webp
//   cuoi-trang.jpg → ảnh cuối trang             → public/images/cuoi-trang.webp
//   og.jpg         → ảnh xem trước khi gửi link → public/og.jpg (1200x630)
//   album/         → thư mục ảnh album, sắp theo tên file (01.jpg, 02.jpg, ...)
//
// Chạy: npm run anh
import sharp from "sharp";
import { readdir, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "anh-goc";
const OUT = "public/images";
const IMG = /\.(jpe?g|png|webp|heic|heif|tiff?)$/i;

await mkdir(OUT, { recursive: true });
const files = existsSync(SRC) ? await readdir(SRC) : [];
const find = (base) => files.find((f) => IMG.test(f) && path.parse(f).name.toLowerCase() === base);

async function single(base, out, width, quality = 82) {
  const f = find(base);
  if (!f) return console.log(`  - bỏ qua ${base} (không thấy anh-goc/${base}.jpg)`);
  await sharp(path.join(SRC, f)).rotate().resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(out);
  console.log(`  ✓ ${f} → ${out}`);
}

console.log("Ảnh chính:");
await single("bia", `${OUT}/bia.webp`, 1400);
await single("phong-bi", `${OUT}/phong-bi.webp`, 1000);
await single("cuoi-trang", `${OUT}/cuoi-trang.webp`, 1400);

const og = find("og") || find("bia");
if (og) {
  await sharp(path.join(SRC, og)).rotate().resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toFile("public/og.jpg");
  console.log(`  ✓ ${og} → public/og.jpg (ảnh xem trước 1200x630)`);
}

console.log("Album:");
const albumDir = path.join(SRC, "album");
const albumFiles = existsSync(albumDir) ? (await readdir(albumDir)).filter((f) => IMG.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : [];
if (!albumFiles.length) {
  console.log("  - chưa có ảnh trong anh-goc/album/ (giữ nguyên album hiện tại)");
} else {
  // xoá ảnh album cũ
  for (const f of await readdir(OUT)) if (/^album-\d+-[sf]\.webp$/.test(f)) await rm(path.join(OUT, f));
  const list = [];
  for (const [i, f] of albumFiles.entries()) {
    const n = String(i + 1).padStart(2, "0");
    const src = path.join(albumDir, f);
    await sharp(src).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${OUT}/album-${n}-f.webp`);
    await sharp(src).rotate().resize({ width: 640, height: 853, fit: "cover", position: "attention" }).webp({ quality: 75 }).toFile(`${OUT}/album-${n}-s.webp`);
    list.push({ s: `/images/album-${n}-s.webp`, f: `/images/album-${n}-f.webp` });
    console.log(`  ✓ ${f} → album-${n}`);
  }
  await writeFile(`${OUT}/gallery.json`, JSON.stringify(list, null, 2));
  console.log(`  ✓ Đã ghi ${OUT}/gallery.json (${list.length} ảnh)`);
}
console.log("Xong!");
