/**
 * يضغط ويصغّر الصور الأصلية من assets/ ويحطها في public/images/ جاهزة للموقع.
 *
 * التشغيل:  npm run images
 *
 * الصور الأصلية (الثقيلة) بتضل في assets/ ولا تُستخدم مباشرة بالموقع.
 * لإضافة صورة جديدة: زيد سطر في قائمة jobs تحت (المصدر ← الاسم في public/images ← العرض الأقصى).
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const WEB = (name) => path.join(ROOT, "assets/images/website", name);
const FB = (id) => path.join(ROOT, "assets/images/facebook", `${id}.jpg`);
const VID = (name) => path.join(ROOT, "assets/videos/website", name);
const OUT = path.join(ROOT, "public/images");

const W = {
  logo: WEB("images__settings__3067a6a9-f3b0-460a-afe4-c202ecb921eflogo.png"),
  logoWhite: WEB("assets__img__logo1.png"),
  favicon: WEB("images__settings__e3682cf9-90a3-48a1-b441-59712ae3f100favicon.png"),
  appleIcon: WEB("assets__img__apple-touch-icon.png"),
  iconWelding: WEB("images__specialization__6eed5add-aad3-490a-9559-4401c1df6e52Layer_2.png"),
  iconHvac: WEB("images__specialization__9b5ba03a-3c73-4850-9445-476b9bef0f5aLayer_3.png"),
  iconConstruction: WEB("images__specialization__22330012-db6b-4e77-b311-c0759e5611a4Layer_5.png"),
};

const post = (n, i, ext = "jpeg") => WEB(`images__posts__${n}__${n}-${i}.${ext}`);
/** صورة غلاف منشور "مساعد أمان – جولة عكا" (أفضل صورة جماعية عندنا) */
const SAFETY_COVER = WEB("images__posts__31f02d2c-bf3e-47a7-af0a-b5bdc118f79ee4d1f88c-1ea9-4bd5-92c8-c6e63262f790.jpeg");

const jobs = [
  // ---- الهوية ----
  { src: W.logo, out: "brand/logo.png", width: 250, format: "png" },
  { src: W.logoWhite, out: "brand/logo-white.png", width: 405, format: "png" },
  { src: W.favicon, out: "brand/favicon.png", width: 32, format: "png" },
  { src: W.appleIcon, out: "brand/apple-touch-icon.png", width: 180, format: "png" },
  { src: W.iconWelding, out: "icons/welding.png", width: 200, format: "png" },
  { src: W.iconHvac, out: "icons/hvac.png", width: 200, format: "png" },
  { src: W.iconConstruction, out: "icons/construction.png", width: 200, format: "png" },

  // ---- الواجهة الرئيسية ----
  { src: FB("1122678666533225"), out: "hero/home.webp", width: 1920, quality: 78 },
  { src: SAFETY_COVER, out: "hero/about.webp", width: 1600 },
  { src: post(1, 16), out: "hero/employers.webp", width: 1600 },

  // ---- المجموعات ----
  { src: FB("1111417677659324"), out: "groups/welding.webp", width: 1400 },
  { src: post(4, 10), out: "groups/hvac.webp", width: 1400 },
  { src: SAFETY_COVER, out: "groups/construction-safety.webp", width: 1400 },

  // ---- الدورات (صورة رئيسية لكل دورة) ----
  { src: FB("1122678666533225"), out: "courses/welding-electrode-co2.webp", width: 1400 },
  { src: post(1, 11), out: "courses/welding-argon.webp", width: 1400 },
  { src: FB("1615775011963533"), out: "courses/welding-pipes.webp", width: 1400 },
  { src: post(4, 10), out: "courses/hvac-technician-level-1.webp", width: 1400 },
  { src: FB("1839470852927280"), out: "courses/hvac-technician-level-2.webp", width: 1400 },
  { src: FB("1671151003092600"), out: "courses/site-manager-engineers.webp", width: 1400 },
  { src: FB("1681308365410197"), out: "courses/scaffolding-builder.webp", width: 1400 },
  { src: SAFETY_COVER, out: "courses/safety-assistant.webp", width: 1400 },
  { src: FB("1190551734485865"), out: "courses/site-manager.webp", width: 1400 },
  { src: FB("1215021787298912"), out: "courses/work-at-height.webp", width: 1400 },
  { src: FB("1042830371184722"), out: "courses/self-loading-crane.webp", width: 1400 },

  // ---- الطاقم ----
  { src: WEB("images__staff__bae4eb14-a5c7-4959-b34b-f28c76c27a8e.jpeg"), out: "staff/issam-najjar.webp", width: 600 },
  { src: WEB("images__staff__1607924a-293c-46fc-961e-a78833b69d8a.jpeg"), out: "staff/mohammad-fahmawi.webp", width: 600 },
  { src: WEB("images__staff__842f3e59-50c7-46c1-8604-a24ab146e8bc.jpeg"), out: "staff/ammar-hatini.webp", width: 600 },
  { src: WEB("images__staff__403cb566-6b16-4e70-a42d-5d2a5750decf.jpeg"), out: "staff/adnan-abu-siam.webp", width: 600 },
  { src: WEB("images__staff__c932da0a-2621-4f0d-be09-ce17c6138329.jpeg"), out: "staff/salsabil-abu-raad.webp", width: 600 },
  { src: WEB("images__staff__3cb8296d-04a4-4a7b-b63d-cf27391d6eef.jpeg"), out: "staff/alaa-mahamid.webp", width: 600 },

  // ---- الخريجون ----
  { src: WEB("images__graduates__43e84311-0053-405e-aed9-7d36eae3c29b4360c0cd-67cd-469c-b389-09fbb61f34b2.jpeg"), out: "graduates/ammar-jabarin.webp", width: 600 },
  { src: WEB("images__graduates__17d20f10-f0f9-4ae0-8945-3a3f49028d1e087d6f2e-e464-4736-a52d-620ff532e228.jpeg"), out: "graduates/najwan-igbariya.webp", width: 600 },
  { src: WEB("images__graduates__4e2251b8-cfa1-4537-a431-b03ee181e12432a2ebd2-b8d8-4e4d-bc11-623ab467ca9c.jpeg"), out: "graduates/mohammad-mahajna.webp", width: 600 },
  { src: WEB("images__graduates__a113c7bd-3af1-4631-891d-d18843c206672638ece9-ef4e-474a-8ba8-ab9c837647d0.jpeg"), out: "graduates/majd-tarabiya.webp", width: 600 },
  { src: WEB("images__graduates__56f2bf48-541e-4e2f-9ee1-b51b351a7d3eb5b21053-5339-4a1f-82a2-232d3173f440.jpeg"), out: "graduates/yousef-mahamid.webp", width: 600 },
  { src: WEB("images__graduates__db972706-d584-4ac5-a480-916a01c01b59c301b325-b353-45e4-bbcf-911095129331.jpeg"), out: "graduates/mohammad-asla.webp", width: 600 },
  { src: WEB("images__graduates__d3c3abd2-8590-4b66-ba99-644be74758f5a561ad9e-98ea-4e33-84e9-0c528aca23f8.jpeg"), out: "graduates/wadee-mahamid.webp", width: 600 },
  { src: WEB("images__graduates__1a4da61f-4dd1-4ae2-b2f5-341455bfe02ef85fbdc0-4f4e-4da5-a159-b836d5f82d8c.jpeg"), out: "graduates/nael-mahajna.webp", width: 600 },
  { src: WEB("images__graduates__7cacba05-9efa-4d5b-8a7f-daa7c473947d231bbce6-7765-41c9-b648-737a9ec58592.jpeg"), out: "graduates/mufleh-amash.webp", width: 600 },
  { src: WEB("images__graduates__4feb36bf-293f-4bfb-af20-4e6e2728ee2e7dd22ad3-27fe-41d4-93c3-6686f28c3231.jpeg"), out: "graduates/mahmoud-igbariya.webp", width: 600 },
  { src: WEB("images__graduates__498ea18b-b6b2-48da-abb7-22ea64355b135e23ef6f-4485-4f2a-88d4-d93f454e08eb.jpeg"), out: "graduates/mousa-fakhouri.webp", width: 600 },
  { src: WEB("images__graduates__d3407557-f5fa-418b-ab4f-c061cf71fb5de741d1c1-e47f-447e-a9ff-f413b721104c.jpeg"), out: "graduates/mehran-abu-abed.webp", width: 600 },
  { src: WEB("images__graduates__ec2087f1-79d2-4c07-96b8-51a67d8b78883d661fca-3a09-4e79-9b2f-faefd80280b1.jpeg"), out: "graduates/ihab-fadila.webp", width: 600 },
  { src: WEB("images__graduates__1235b99c-03a3-4399-8c09-775d8d4237dcb6c12761-50ee-45bb-bc65-f2ab8f515047.jpeg"), out: "graduates/alaa-katana.webp", width: 600 },
  { src: WEB("images__graduates__a08c2651-be8d-42a5-bdf9-a9cfb06e283fadb27351-4eb8-49b9-8c4f-70c8f10a2899.jpeg"), out: "graduates/kamal-igbariya.webp", width: 600 },
  { src: WEB("images__graduates__321eae0c-bc0d-4a02-85c0-58dd5819f02cf85fbdc0-4f4e-4da5-a159-b836d5f82d8c.jpeg"), out: "graduates/luqman-aql.webp", width: 600 },

  // ---- الشركاء ----
  { src: WEB("images__partners__2be61bdc-0a6f-4f34-aa7a-2b61bae1ef5ba2.png"), out: "partners/john-deere.png", width: 320, format: "png" },
  { src: WEB("images__partners__56946c44-c8c3-4cdd-ba5e-f81af87b73cca4.png"), out: "partners/beton-mawasi.png", width: 320, format: "png" },
  { src: WEB("images__partners__81a1c833-678a-4993-b74a-ab3b5c3a1891a3.png"), out: "partners/merkavim.png", width: 320, format: "png" },
  { src: WEB("images__partners__aca5887c-3fe9-438f-ac08-0a168f44b02ea5.png"), out: "partners/ministry-of-transport.png", width: 320, format: "png" },
  { src: WEB("images__partners__fb4028cd-e2bc-4879-85be-0f32fcbf1f63WEBSITE__ALMARKAZ26-08.png"), out: "partners/ministry-of-labor.png", width: 320, format: "png" },

  // ---- الأخبار (صور من منشورات الموقع القديم + فيسبوك) ----
  ...[10, 11, 12, 13, 14, 16].map((i, k) => ({ src: post(1, i), out: `news/welding-course-2024/${k + 1}.webp`, width: 1400 })),
  { src: SAFETY_COVER, out: "news/safety-assistant-field-tour-akko/1.webp", width: 1400 },
  ...[4, 2, 5, 7, 12].map((i, k) => ({ src: post(3, i), out: `news/safety-assistant-field-tour-akko/${k + 2}.webp`, width: 1400 })),
  ...[10, 2, 3, 4, 6, 12].map((i, k) => ({ src: post(4, i), out: `news/hvac-practical-lessons/${k + 1}.webp`, width: 1400 })),
  ...[1, 10, 12, 14, 16, 3].map((i, k) => ({ src: post(5, i), out: `news/self-loading-crane-practical/${k + 1}.webp`, width: 1400 })),
  ...["1215021787298912", "1215893950545029", "1215900873877670", "1215900967210994"].map((id, k) => ({ src: FB(id), out: `news/work-at-height-training-2025/${k + 1}.webp`, width: 1400 })),
  ...["1765878815546537", "1765878338879918", "1765878412213244", "1765878548879897", "1765884918879260", "1765885038879248"].map((id, k) => ({ src: FB(id), out: `news/certificates-ceremony-2026/${k + 1}.webp`, width: 1400 })),

  // ---- المعرض (صور حقيقية من صفحة الفيسبوك) ----
  ...[
    ["welding", ["1122678666533225", "1535548293319539", "1564153657125669", "1645818278959206", "1839470956260603", "768616178606144", "768616248606137", "1111417677659324", "1615775011963533"]],
    ["hvac", ["1535929873281381", "1605731369634564", "1669109853296715", "1839441099596922", "1839441156263583", "1122678546533237"]],
    ["construction", ["1167018543505851", "1190547934486245", "1380011828873187", "1662343237306710", "1671151003092600", "1681308462076854", "1190551734485865",
      "1681308365410197", "1681308418743525", "1839441286263570", "1839470852927280",
      "1215021787298912", "1215893950545029", "1215900873877670", "1215900967210994",
      "1041422917992134", "1042830371184722", "1052620596872366", "1111417270992698"]],
    ["events", ["1123483031192736", "1123483217859384", "1190551441152561", "1554836148057420", "1731995810341452", "1908517936022571", "757723426362086", "803525241781904", "1162470272554064", "1765878815546537", "757721826362246", "802165751917853"]],
  ].flatMap(([cat, ids]) => ids.map((id) => ({ src: FB(id), out: `gallery/${cat}/${id}.webp`, width: 1600 }))),

  // ---- الفيديو (صور مصغّرة من يوتيوب) ----
  { src: VID("2021-04-14_c3PP4-TM3Y0.webp"), out: "videos/c3PP4-TM3Y0.webp", width: 1280 },
  { src: VID("2021-06-26_BnQOOEvTenw.webp"), out: "videos/BnQOOEvTenw.webp", width: 1280 },
];

let total = 0;
for (const job of jobs) {
  const outPath = path.join(OUT, job.out);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const fmt = job.format ?? "webp";
  let img = sharp(job.src).rotate().resize({ width: job.width, withoutEnlargement: true });
  img = fmt === "png" ? img.png({ compressionLevel: 9, palette: false }) : img.webp({ quality: job.quality ?? 80 });
  const info = await img.toFile(outPath);
  total += info.size;
}
console.log(`تم: ${jobs.length} صورة — الحجم الإجمالي ${(total / 1024 / 1024).toFixed(1)} ميغا`);
