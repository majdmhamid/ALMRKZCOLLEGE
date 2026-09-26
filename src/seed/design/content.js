/* Shared bilingual content for the ALMRKZ college landing pages. Source: AMRKZCOLLEGE/content/*.ts */
(function () {
  const site = {
    name: { ar: "كلية المركز للتأهيل المهني", he: "מכללת המרכז להכשרה מקצועית" },
    shortName: { ar: "كلية المركز", he: "מכללת המרכז" },
    city: { ar: "أم الفحم", he: "אום אל-פחם" },
    foundedYear: 2008,
    phone: "04-6116800",
    phoneIntl: "+97246116800",
    mobile: "054-6174339",
    whatsappUrl: "https://wa.me/972546174339",
    email: "almerkaz.collega@gmail.com",
    address: { ar: "أم الفحم – حي قحاوش – خلف المشهداوي", he: "אום אל-פחם – שכונת קחאוש – מאחורי אל-משהדאווי" },
    facebook: "https://www.facebook.com/almerkaz.collega/",
    youtube: "https://www.youtube.com/channel/UCieezydJBA3mmdXvl8p6BnQ",
    hours: { ar: "الأحد – الخميس · للاستفسار عن ساعات الاستقبال تواصل معنا", he: "ראשון – חמישי · לשעות קבלה מדויקות צרו קשר" },
  };

  const groups = [
    { slug: "welding", name: { ar: "الحديد واللحام", he: "ריתוך ומתכת" }, short: { ar: "اللحام", he: "ריתוך" }, tagline: { ar: "مهنة مطلوبة في كل مصنع وورشة وموقع بناء", he: "מקצוע מבוקש בכל מפעל, מסגרייה ואתר בנייה" }, icon: "assets/icons/welding.png", image: "assets/groups/welding.webp", count: 3 },
    { slug: "hvac", name: { ar: "التكييف والتبريد", he: "קירור ומיזוג אוויר" }, short: { ar: "التكييف", he: "מיזוג אוויר" }, tagline: { ar: "من التركيب حتى تصليح الأعطال — بشهادة معتمدة", he: "מהתקנה ועד תיקון תקלות – עם תעודה מוכרת" }, icon: "assets/icons/hvac.png", image: "assets/groups/hvac.webp", count: 2 },
    { slug: "construction-safety", name: { ar: "البناء والسلامة", he: "בניין ובטיחות" }, short: { ar: "البناء والسلامة", he: "בניין ובטיחות" }, tagline: { ar: "الشهادات التي يطلبها القانون في كل موقع بناء", he: "ההסמכות שהחוק דורש בכל אתר בנייה" }, icon: "assets/icons/construction.png", image: "assets/groups/construction-safety.webp", count: 6 },
    { slug: "carpentry", name: { ar: "النجارة", he: "נגרות" }, short: { ar: "النجارة", he: "נגרות" }, tagline: { ar: "من قراءة المخطط حتى تركيب الأثاث والأبواب", he: "מקריאת שרטוט ועד התקנת רהיטים ודלתות" }, icon: "assets/icons/construction.png", image: "assets/groups/carpentry-placeholder.svg", count: 0 },
    { slug: "cranes", name: { ar: "الرافعات والمنوف", he: "עגורנים ומנופים" }, short: { ar: "الرافعات", he: "עגורנים" }, tagline: { ar: "تشغيل رافعات ومنوف بترخيص رسمي", he: "הפעלת עגורנים ומנופים ברישיון רשמי" }, icon: "assets/icons/construction.png", image: "assets/courses/self-loading-crane.webp", count: 1 },
  ];

  const courses = [
    { slug: "welding-electrode-co2", group: "welding", featured: true, name: { ar: "دورة لحام إلكترود و-CO2", he: "קורס ריתוך אלקטרודה ו-CO2" }, summary: { ar: "الدورة الأساسية لدخول مهنة اللحام: 100 ساعة، نصفها تدريب عملي في الورشة.", he: "קורס הבסיס לכניסה למקצוע הריתוך: 100 שעות, מחציתן תרגול מעשי בסדנה." }, hours: 100, sessions: 25, image: "assets/courses/welding-electrode-co2.webp" },
    { slug: "welding-argon", group: "welding", name: { ar: "دورة لحام أرغون (TIG)", he: "קורס ריתוך ארגון (TIG)" }, summary: { ar: "لحام دقيق للستانلس والألمنيوم والفولاذ — للحّامين الذين يريدون التخصص.", he: "ריתוך מדויק של נירוסטה, אלומיניום ופלדה – לרתכים שרוצים להתמקצע." }, hours: 50, sessions: 20, image: "assets/courses/welding-argon.webp" },
    { slug: "hvac-technician-level-1", group: "hvac", featured: true, name: { ar: "دورة تقني تكييف وتبريد – المستوى الأول", he: "קורס טכנאי קירור ומיזוג אוויר – דרג 1" }, summary: { ar: "التأهيل الكامل لمهنة تقني تكييف: 288 ساعة نظري وعملي، بشهادة بإشراف وزارة العمل.", he: "ההכשרה המלאה למקצוע טכנאי מיזוג: 288 שעות עיוני ומעשי, עם תעודה בפיקוח משרד העבודה." }, hours: 288, sessions: 50, image: "assets/courses/hvac-technician-level-1.webp" },
    { slug: "site-manager", group: "construction-safety", featured: true, name: { ar: "دورة مدير عمل في البناء", he: "קורס מנהל עבודה בבניין" }, summary: { ar: "الدورة الأشمل في الكلية (670 ساعة): تأهيل لوظيفة مدير عمل — وظيفة إلزامية في كل موقع بناء.", he: "הקורס המקיף ביותר במכללה (670 שעות): הכשרה לתפקיד מנהל עבודה – תפקיד חובה בכל אתר בנייה." }, hours: 670, sessions: 160, image: "assets/courses/site-manager.webp" },
    { slug: "safety-assistant", group: "construction-safety", featured: true, name: { ar: "دورة مساعد أمان في البناء", he: "קורס עוזר בטיחות" }, summary: { ar: "وظيفة إلزامية بحسب القانون في كل موقع بناء يزيد ارتفاعه عن 7 أمتار ومساحته عن 1000 م².", he: "תפקיד חובה על פי חוק בכל אתר בנייה שגובהו מעל 7 מטר ושטחו מעל 1,000 מ״ר." }, hours: 45, sessions: 10, image: "assets/courses/safety-assistant.webp" },
    { slug: "scaffolding-builder", group: "construction-safety", name: { ar: "دورة بنّاء سقالات محترف", he: "קורס בונה מקצועי לפיגומים" }, summary: { ar: "الشهادة التي يطلبها القانون للإشراف على تركيب وفك السقالات فوق 6 أمتار.", he: "ההסמכה שהחוק דורש לפיקוח על הקמה ופירוק של פיגומים בגובה מעל 6 מטרים." }, hours: 60, sessions: 13, image: "assets/courses/scaffolding-builder.webp" },
    { slug: "self-loading-crane", group: "construction-safety", name: { ar: "دورة مشغّل رافعة تحميل ذاتي", he: "קורס עגורן להעמסה עצמית" }, summary: { ar: "96 ساعة نظري وعملي لاعتماد مشغّلي الرافعات وفق برنامج وزارة العمل.", he: "96 שעות עיוני ומעשי להסמכת עגורנאים להעמסה עצמית, לפי תוכנית משרד העבודה." }, hours: 96, sessions: 30, image: "assets/courses/self-loading-crane.webp" },
    { slug: "work-at-height", group: "construction-safety", name: { ar: "تدريب العمل على ارتفاع", he: "הדרכת עבודה בגובה" }, summary: { ar: "يوم تدريب واحد إلزامي بحسب القانون لكل من يعمل على ارتفاع. التصريح ساري لسنتين.", he: "יום הדרכה אחד, חובה על פי חוק לכל מי שעובד בגובה. האישור תקף לשנתיים." }, hours: 8, sessions: 1, image: "assets/courses/work-at-height.webp" },
  ];
  const courseNames = {
    "welding-pipes": { ar: "دورة لحام أنابيب وخزانات ضغط", he: "קורס ריתוך צנרת ומיכלי לחץ" },
    "hvac-technician-level-2": { ar: "دورة تقني تكييف وتبريد – المستوى الثاني", he: "קורס טכנאי קירור ומיזוג אוויר – דרג 2" },
  };
  courses.forEach((c) => (courseNames[c.slug] = c.name));

  const graduates = [
    { slug: "ammar-jabarin", name: { ar: "عمار جبارين", he: "עמאר ג׳בארין" }, course: "scaffolding-builder", image: "assets/graduates/ammar-jabarin.webp" },
    { slug: "najwan-igbariya", name: { ar: "نجوان إغبارية", he: "נג׳ואן אגבאריה" }, course: "self-loading-crane", image: "assets/graduates/najwan-igbariya.webp" },
    { slug: "mohammad-mahajna", name: { ar: "محمد محاجنة", he: "מוחמד מחאג׳נה" }, course: "welding-pipes", image: "assets/graduates/mohammad-mahajna.webp" },
    { slug: "majd-tarabiya", name: { ar: "مجد طربية", he: "מג׳ד טרביה" }, course: "safety-assistant", image: "assets/graduates/majd-tarabiya.webp" },
    { slug: "yousef-mahamid", name: { ar: "يوسف محاميد", he: "יוסף מחאמיד" }, course: "welding-pipes", image: "assets/graduates/yousef-mahamid.webp" },
    { slug: "mohammad-asla", name: { ar: "محمد عاصلة", he: "מוחמד עאסלה" }, course: "scaffolding-builder", image: "assets/graduates/mohammad-asla.webp" },
    { slug: "wadee-mahamid", name: { ar: "وديع محاميد", he: "ודיע מחאמיד" }, course: "hvac-technician-level-2", image: "assets/graduates/wadee-mahamid.webp" },
    { slug: "nael-mahajna", name: { ar: "نائل محاجنة", he: "נאיל מחאג׳נה" }, course: "welding-electrode-co2", image: "assets/graduates/nael-mahajna.webp" },
  ];

  const staff = [
    { slug: "alaa-mahamid", name: { ar: "علاء محاميد", he: "עלאא מחאמיד" }, role: { ar: "مدير الكلية · محاسب ومستشار ضرائب", he: "מנהל המכללה · רו״ח ויועץ מס" }, image: "assets/staff/alaa-mahamid.webp" },
    { slug: "mohammad-fahmawi", name: { ar: "محمد فحماوي", he: "מוחמד פחמאוי" }, role: { ar: "مركّز دورات اللحام", he: "רכז קורסי ריתוך" }, image: "assets/staff/mohammad-fahmawi.webp" },
    { slug: "issam-najjar", name: { ar: "عصام نجار", he: "עיסאם נג׳אר" }, role: { ar: "مركّز دورات التكييف والتبريد", he: "רכז קורסי קירור ומיזוג אוויר" }, image: "assets/staff/issam-najjar.webp" },
    { slug: "ammar-hatini", name: { ar: "عمار حطيني", he: "עמאר חטיני" }, role: { ar: "مركّز دورات البناء والسلامة", he: "רכז קורסי בניין ובטיחות" }, image: "assets/staff/ammar-hatini.webp" },
    { slug: "adnan-abu-siam", name: { ar: "عدنان أبو صيام", he: "עדנאן אבו סיאם" }, role: { ar: "مركّز دورات البناء والسلامة", he: "רכז קורסי בניין ובטיחות" }, image: "assets/staff/adnan-abu-siam.webp" },
    { slug: "salsabil-abu-raad", name: { ar: "سلسبيل أبو رعد", he: "סלסביל אבו רעד" }, role: { ar: "مديرة المكتب والتسجيل", he: "מנהלת משרד ורישום" }, image: "assets/staff/salsabil-abu-raad.webp" },
  ];

  const partners = [
    { slug: "ministry-of-labor", name: { ar: "وزارة العمل", he: "משרד העבודה" }, image: "assets/partners/ministry-of-labor-trim.png" },
    { slug: "ministry-of-transport", name: { ar: "وزارة المواصلات والأمان على الطرق", he: "משרד התחבורה והבטיחות בדרכים" }, image: "assets/partners/ministry-of-transport-trim.png" },
    { slug: "john-deere", name: { ar: "John Deere", he: "John Deere" }, image: "assets/partners/john-deere-trim.png" },
    { slug: "merkavim", name: { ar: "مركافيم", he: "מרכבים" }, image: "assets/partners/merkavim-trim.png" },
    { slug: "beton-mawasi", name: { ar: "باطون مواسي", he: "בטון מואסי" }, image: "assets/partners/beton-mawasi-trim.png" },
  ];

  const news = [
    { slug: "certificates-ceremony-2026", date: "2026-09-07", title: { ar: "توزيع الشهادات على فوج جديد من خريجي الكلية", he: "חלוקת תעודות למחזור חדש של בוגרי המכללה" }, excerpt: { ar: "مبروك لخريجينا الجدد! صور من حفل توزيع الشهادات في الكلية.", he: "מזל טוב לבוגרים החדשים שלנו! תמונות מטקס חלוקת התעודות במכללה." }, image: "assets/news/certificates.webp" },
    { slug: "work-at-height-training-2025", date: "2025-02-23", title: { ar: "تدريب عملي على العمل على ارتفاع", he: "הדרכה מעשית לעבודה בגובה" }, excerpt: { ar: "صور من التدريب العملي: استخدام معدات الحماية الشخصية والعمل الآمن على السلالم والسقالات.", he: "תמונות מהתרגול המעשי: שימוש בציוד מגן אישי ועבודה בטוחה על סולמות ופיגומים." }, image: "assets/news/height.webp" },
    { slug: "safety-assistant-field-tour-akko", date: "2024-10-28", title: { ar: "جولة تعليم ميداني لدورة مساعد أمان في مدينة عكا", he: "סיור לימודי בשטח לקורס עוזר בטיחות בעכו" }, excerpt: { ar: "طلاب دورة مساعد أمان في البناء في جولة ميدانية بموقع بناء في عكا، بإشراف المركّز عمار حطيني.", he: "תלמידי קורס עוזר בטיחות בסיור שטח באתר בנייה בעכו, בהנחיית הרכז עמאר חטיני." }, image: "assets/news/akko.webp" },
  ];

  const videos = [
    { id: "c3PP4-TM3Y0", title: { ar: "اللي بإيدو صنعة بملك قلعة — تعرّف على كلية المركز", he: "מי שיש בידיו מקצוע – הכירו את מכללת המרכז" }, thumb: "assets/videos/c3PP4-TM3Y0.webp" },
    { id: "BnQOOEvTenw", title: { ar: "جولة في ورشات كلية المركز – أم الفحم", he: "סיור בסדנאות מכללת המרכז – אום אל-פחם" }, thumb: "assets/videos/BnQOOEvTenw.webp" },
  ];

  const gallery = ["assets/gallery/w1.webp", "assets/gallery/w2.webp", "assets/gallery/w3.webp", "assets/gallery/h1.webp", "assets/gallery/h2.webp", "assets/gallery/c1.webp", "assets/gallery/c2.webp", "assets/gallery/c3.webp", "assets/gallery/e1.webp", "assets/gallery/e2.webp"];

  const ar = {
    otherLang: "עברית",
    nav: { home: "الرئيسية", courses: "الدورات", allCourses: "كل الدورات", about: "عن الكلية", graduates: "الخريجون", gallery: "الصور والفيديو", news: "أخبار", employers: "للشركات والمشغّلين", contact: "اتصل بنا", menu: "القائمة", close: "إغلاق", faq: "أسئلة شائعة", staff: "الطاقم" },
    common: { readMore: "اقرأ المزيد", viewCourse: "تفاصيل الدورة", allCourses: "شاهد كل الدورات", contactUs: "تواصل معنا", whatsapp: "واتساب", whatsappLong: "راسلنا على واتساب", call: "اتصل", registerInterest: "سجّل اهتمامك", hours: "ساعة", sessions: "لقاء", swipe: "اسحب لعرض المزيد", courseCount: "دورات", evening: "مسائي · 17:00–21:00", nextStart: "الموعد القادم: تواصل معنا" },
    hero: { badge: "معتمدة من وزارة العمل · منذ 2008", title: "كلية المركز للتأهيل المهني", subtitle: "أم الفحم", text: "دورات مهنية عملية في اللحام، التكييف والتبريد، البناء والسلامة — بمجموعات صغيرة، ورشات مجهّزة، وشهادات يطلبها سوق العمل.", ctaCourses: "شاهد الدورات", ctaWhatsapp: "تواصل عبر واتساب", slogan: "اللي بإيدو صنعة بملك قلعة", scrollHint: "اسحب للأسفل", kicker: "نتعلم وننطلق إلى سوق العمل." },
    stats: { years: "سنة خبرة", courses: "دورة مهنية", groups: "مجالات تأهيل", partners: "جهات معتمِدة وشريكة", graduates: "خريج بالصور", alumni: "خريج" },
    trust: [
      { title: "منذ 2008", text: "خبرة 18 سنة في التأهيل المهني" },
      { title: "بإشراف وزارة العمل", text: "برامج معتمدة وشهادات معترف بها" },
      { title: "مجموعات صغيرة", text: "اهتمام شخصي بكل طالب" },
      { title: "ملائمة للمنح", text: "الدورات ملائمة للحصول على منحة (שוברים)" },
      { title: "مرافقة مهنية", text: "توجيه ومرافقة مهنية بعد التخرّج" },
    ],
    home: {
      groupsTitle: "مجالات التأهيل", groupsSubtitle: "خمسة مجالات تأهيل، لكل واحد ورشة مجهّزة وطاقم متخصص.", swipeHint: "اسحب لرؤية كل المجالات",
      whyTitle: "ليش كلية المركز؟",
      whyItems: [
        { title: "استشارة شخصية", text: "لقاء تعارف قبل التسجيل: نتعرف عليك ونوجّهك للدورة الملائمة." },
        { title: "تعليم عملي", text: "ورشات مجهّزة بمعدات حقيقية، والتدريب العملي جزء أساسي من كل دورة." },
        { title: "طاقم ذو خبرة", text: "مركّزون ومحاضرون بخبرة طويلة في الميدان، لا في الصف فقط." },
        { title: "مرافقة وتوجيه مهني", text: "بعد التخرّج نرافقك بالتوجيه: شو السوق بدّو، وين الفرص، وكيف تتقدّم." },
      ],
      coursesTitle: "أبرز الدورات", coursesSubtitle: "الدورات الأكثر طلباً في الكلية",
      graduatesTitle: "خريجونا", graduatesSubtitle: "قصص نجاح حقيقية من طلاب الكلية",
      staffTitle: "طاقم الكلية", staffSubtitle: "مركّزون ومحاضرون بخبرة طويلة في الميدان",
      videoTitle: "تعرّف على الكلية بالفيديو", newsTitle: "آخر الأخبار", partnersTitle: "بالتعاون مع",
      ctaTitle: "جاهز تبدأ؟", ctaText: "اترك اسمك ورقمك ونرجع إليك للاستشارة — أو راسلنا مباشرة على واتساب.",
      galleryTitle: "لمحة من ورشاتنا", galleryText: "صور حقيقية من التدريبات العملية والجولات الميدانية.",
      faqTitle: "أسئلة شائعة", faqText: "أكثر الأسئلة اللي بتوصلنا من الطلاب.",
      employersTitle: "للشركات والمشغّلين", employersText: "الكلية تعمل مع شركات ومقاولين ومصالح في المنطقة لتأهيل الموظفين والعمال وفق متطلبات القانون وسوق العمل.",
      employersItems: [
        { title: "تأهيل موظفين", text: "دورات معتمدة لموظفيك: لحام، تكييف وتبريد، مساعد أمان، بنّاء سقالات، ومشغّل رافعة." },
        { title: "تدريب العمل على ارتفاع في موقعكم", text: "التدريب الإلزامي بحسب القانون — في ورشة الكلية أو في موقع الشركة في كل أنحاء البلاد." },
        { title: "تدريبات تنشيط (רענון)", text: "تجديد تصاريح العمل على ارتفاع وتدريبات السلامة الدورية لطواقم العمل." },
        { title: "دورات مخصّصة", text: "برنامج تدريب مبني حسب حاجة الشركة، بمواعيد مرنة تناسب دوام العمل." },
      ],
      hiringTitle: "تبحث عن مهنيين؟", hiringText: "الكلية على تواصل دائم مع خريجيها. تواصل معنا ونوجّه إليك خريجين ملائمين.",
    },
    faq: [
      { q: "بحتاج خبرة سابقة؟", a: "لا. دورات اللحام والتكييف والعمل على ارتفاع مفتوحة للمبتدئين من عمر 18. دورات السلامة (مساعد أمان، سقالات، مدير عمل) بتطلب خبرة في البناء حسب القانون — نفحصها معك في لقاء التعارف." },
      { q: "في منحة (שוברים)؟", a: "الدورات ملائمة للحصول على منحة — تواصل معنا للاستشارة، ونرافقك بالإجراءات مع الجهات المعنية." },
      { q: "شو مواعيد الدورات؟", a: "معظم الدورات مسائية 17:00–21:00 حتى تناسب اللي بيشتغل بالنهار. تدريب العمل على ارتفاع يوم واحد 08:00–16:00. الموعد القادم: تواصل معنا." },
      { q: "أي شهادة بحصل عليها؟", a: "دورات السلامة والتكييف والرافعة بشهادة بإشراف وزارة العمل. دورات اللحام بشهادة من الكلية مع إمكانية امتحان اعتماد دولي من معهد المواصفات." },
      { q: "كيف بسجّل؟", a: "اترك اسمك ورقمك بالاستمارة أو راسلنا على واتساب. نرجع إليك، نعمل لقاء تعارف قصير، ونوجّهك للدورة الملائمة." },
      { q: "بتساعدوني بعد التخرّج؟", a: "نعم — مرافقة وتوجيه مهني: شو السوق بدّو، وين الفرص، وكيف تقدّم نفسك. الكلية تقدّم مرافقة وتوجيه مهني، ولا تلتزم بتأمين مكان عمل." },
      { q: "في دورات للشركات؟", a: "نعم. تأهيل موظفين، تدريب العمل على ارتفاع في موقعكم، تدريبات تنشيط، ودورات مخصّصة حسب حاجة الشركة." },
    ],
    course: { careerDisclaimer: "الكلية تقدّم مرافقة وتوجيه مهني، ولا تلتزم بتأمين مكان عمل.", contactForPrice: "للاستفسار عن الرسوم والمنح ومواعيد الفتح — تواصل معنا.", scholarship: "الدورة ملائمة للحصول على منحة — تواصل معنا للاستشارة." },
    form: { name: "الاسم الكامل", phone: "رقم الهاتف", email: "البريد الإلكتروني (اختياري)", course: "الدورة التي تهمّك", courseSelect: "اختر دورة…", courseAny: "لم أقرر بعد / استشارة عامة", message: "ملاحظات (اختياري)", submit: "أرسل", privacy: "معلوماتك تُستخدم فقط للتواصل معك بخصوص الدورات.", successTitle: "وصلنا طلبك، شكراً!", successText: "سنتواصل معك في أقرب وقت. إذا بدك جواب أسرع، راسلنا على واتساب." },
    footer: { aboutText: "كلية للتأهيل المهني في أم الفحم، تأسست سنة 2008 وتعمل بإشراف وزارة العمل. دورات عملية في اللحام، التكييف والتبريد، والبناء والسلامة.", quickLinks: "روابط سريعة", coursesTitle: "الدورات", contactTitle: "اتصل بنا", rights: "جميع الحقوق محفوظة", accessibility: "إعلان الوصولية" },
    a11y: "أدوات الوصولية",
  };

  const he = {
    otherLang: "العربية",
    nav: { home: "דף הבית", courses: "קורסים", allCourses: "כל הקורסים", about: "אודות המכללה", graduates: "בוגרים", gallery: "תמונות ווידאו", news: "חדשות", employers: "לחברות ולמעסיקים", contact: "צור קשר", menu: "תפריט", close: "סגירה", faq: "שאלות נפוצות", staff: "הצוות" },
    common: { readMore: "קראו עוד", viewCourse: "פרטי הקורס", allCourses: "לכל הקורסים", contactUs: "צרו קשר", whatsapp: "וואטסאפ", whatsappLong: "כתבו לנו בוואטסאפ", call: "התקשרו", registerInterest: "השאירו פרטים", hours: "שעות", sessions: "מפגשים", swipe: "החליקו לעוד", courseCount: "קורסים", evening: "ערב · 17:00–21:00", nextStart: "המחזור הקרוב: צרו קשר" },
    hero: { badge: "בפיקוח משרד העבודה · מאז 2008", title: "מכללת המרכז להכשרה מקצועית", subtitle: "אום אל-פחם", text: "קורסים מקצועיים מעשיים בריתוך, קירור ומיזוג אוויר, בניין ובטיחות – בקבוצות קטנות, סדנאות מאובזרות, ותעודות ששוק העבודה מחפש.", ctaCourses: "לקורסים", ctaWhatsapp: "דברו איתנו בוואטסאפ", slogan: "מי שיש בידו מקצוע – יש בידו מבצר", scrollHint: "גללו למטה", kicker: "לומדים ויוצאים לשוק העבודה." },
    stats: { years: "שנות ניסיון", courses: "קורסים מקצועיים", groups: "תחומי הכשרה", partners: "גופים מאשרים ושותפים", graduates: "בוגרים בתמונות" , alumni: "בוגרים" },
    trust: [
      { title: "מאז 2008", text: "18 שנות ניסיון בהכשרה מקצועית" },
      { title: "בפיקוח משרד העבודה", text: "תוכניות מאושרות ותעודות מוכרות" },
      { title: "קבוצות קטנות", text: "יחס אישי לכל תלמיד" },
      { title: "מתאים לשוברים", text: "הקורסים מתאימים לקבלת שובר הכשרה" },
      { title: "ליווי מקצועי", text: "הכוונה וליווי מקצועי לאחר סיום הלימודים" },
    ],
    home: {
      groupsTitle: "תחומי ההכשרה", groupsSubtitle: "חמישה תחומי הכשרה, לכל אחד סדנה מאובזרת וצוות מקצועי.", swipeHint: "החליקו לכל התחומים",
      whyTitle: "למה מכללת המרכז?",
      whyItems: [
        { title: "ייעוץ אישי", text: "פגישת היכרות לפני ההרשמה: מכירים אתכם ומכוונים לקורס המתאים." },
        { title: "לימוד מעשי", text: "סדנאות מאובזרות בציוד אמיתי, והתרגול המעשי הוא חלק מרכזי בכל קורס." },
        { title: "צוות מנוסה", text: "רכזים ומרצים עם ניסיון רב בשטח, לא רק בכיתה." },
        { title: "ליווי והכוונה מקצועית", text: "אחרי הסיום מלווים אתכם בהכוונה: מה השוק מחפש, איפה ההזדמנויות, ואיך להתקדם." },
      ],
      coursesTitle: "הקורסים המובילים", coursesSubtitle: "הקורסים המבוקשים ביותר במכללה",
      graduatesTitle: "הבוגרים שלנו", graduatesSubtitle: "סיפורי הצלחה אמיתיים של תלמידי המכללה",
      staffTitle: "צוות המכללה", staffSubtitle: "רכזים ומרצים עם ניסיון רב בשטח",
      videoTitle: "הכירו את המכללה בווידאו", newsTitle: "חדשות אחרונות", partnersTitle: "בשיתוף עם",
      ctaTitle: "מוכנים להתחיל?", ctaText: "השאירו שם וטלפון ונחזור אליכם לייעוץ – או כתבו לנו ישירות בוואטסאפ.",
      galleryTitle: "הצצה לסדנאות שלנו", galleryText: "תמונות אמיתיות מהתרגולים המעשיים ומסיורי השטח.",
      faqTitle: "שאלות נפוצות", faqText: "השאלות שהתלמידים שואלים אותנו הכי הרבה.",
      employersTitle: "לחברות ולמעסיקים", employersText: "המכללה עובדת עם חברות, קבלנים ועסקים באזור להכשרת עובדים בהתאם לדרישות החוק ושוק העבודה.",
      employersItems: [
        { title: "הכשרת עובדים", text: "קורסים מוכרים לעובדיכם: ריתוך, קירור ומיזוג, עוזר בטיחות, בונה פיגומים ומפעיל עגורן." },
        { title: "הדרכת עבודה בגובה אצלכם", text: "הדרכת החובה על פי חוק – בסדנת המכללה או באתר החברה, בפריסה ארצית." },
        { title: "הדרכות רענון", text: "חידוש אישורי עבודה בגובה והדרכות בטיחות תקופתיות לצוותי העבודה." },
        { title: "קורסים מותאמים", text: "תוכנית הכשרה הנבנית לפי צורכי החברה, במועדים גמישים המתאימים לשעות העבודה." },
      ],
      hiringTitle: "מחפשים אנשי מקצוע?", hiringText: "המכללה בקשר רציף עם בוגריה. צרו קשר ונפנה אליכם בוגרים מתאימים.",
    },
    faq: [
      { q: "צריך ניסיון קודם?", a: "לא. קורסי הריתוך, המיזוג והעבודה בגובה פתוחים למתחילים מגיל 18. קורסי הבטיחות (עוזר בטיחות, פיגומים, מנהל עבודה) דורשים ניסיון בבנייה על פי חוק – נבדוק יחד בפגישת ההיכרות." },
      { q: "יש שוברים (מלגה)?", a: "הקורסים מתאימים לקבלת שובר הכשרה – צרו קשר לייעוץ, ונלווה אתכם בתהליך מול הגופים הרלוונטיים." },
      { q: "מתי הלימודים?", a: "רוב הקורסים בערב 17:00–21:00, כך שמתאימים למי שעובד ביום. הדרכת עבודה בגובה – יום אחד 08:00–16:00. המחזור הקרוב: צרו קשר." },
      { q: "איזו תעודה מקבלים?", a: "קורסי הבטיחות, המיזוג והעגורן – תעודה בפיקוח משרד העבודה. קורסי הריתוך – תעודה מהמכללה עם אפשרות למבחן הסמכה בינלאומי של מכון התקנים." },
      { q: "איך נרשמים?", a: "השאירו שם וטלפון בטופס או כתבו לנו בוואטסאפ. נחזור אליכם, נקבע פגישת היכרות קצרה ונכוון אתכם לקורס המתאים." },
      { q: "יש ליווי אחרי הסיום?", a: "כן – ליווי והכוונה מקצועית: מה השוק מחפש, איפה ההזדמנויות ואיך להציג את עצמכם. המכללה מעניקה ליווי והכוונה מקצועית, ואינה מתחייבת להשמה במקום עבודה." },
      { q: "יש קורסים לחברות?", a: "כן. הכשרת עובדים, הדרכת עבודה בגובה אצלכם, הדרכות רענון וקורסים מותאמים לצורכי החברה." },
    ],
    course: { careerDisclaimer: "המכללה מעניקה ליווי והכוונה מקצועית, ואינה מתחייבת להשמה במקום עבודה.", contactForPrice: "לפרטים על עלויות, שוברים ומועדי פתיחה – צרו קשר.", scholarship: "הקורס מתאים לקבלת שובר הכשרה – צרו קשר לייעוץ." },
    form: { name: "שם מלא", phone: "טלפון", email: "אימייל (לא חובה)", course: "הקורס שמעניין אתכם", courseSelect: "בחרו קורס…", courseAny: "עדיין לא החלטתי / ייעוץ כללי", message: "הערות (לא חובה)", submit: "שליחה", privacy: "הפרטים ישמשו אך ורק ליצירת קשר בנוגע לקורסים.", successTitle: "הפרטים התקבלו, תודה!", successText: "נחזור אליכם בהקדם. למענה מהיר יותר, כתבו לנו בוואטסאפ." },
    footer: { aboutText: "מכללה להכשרה מקצועית באום אל-פחם, שהוקמה בשנת 2008 ופועלת בפיקוח משרד העבודה. קורסים מעשיים בריתוך, קירור ומיזוג אוויר, בניין ובטיחות.", quickLinks: "קישורים מהירים", coursesTitle: "קורסים", contactTitle: "צור קשר", rights: "כל הזכויות שמורות", accessibility: "הצהרת נגישות" },
    a11y: "כלי נגישות",
  };

  const dict = { ar, he };
  const t = (v, l) => (v && typeof v === "object" ? v[l] ?? v.ar : v);

  /** Flatten everything for a locale so templates can use simple dotted lookups. */
  function forLocale(l) {
    const d = dict[l];
    const gName = (slug) => t(groups.find((g) => g.slug === slug)?.name, l);
    return {
      lang: l,
      d,
      site: { ...site, name: site.name[l], shortName: site.shortName[l], city: site.city[l], address: site.address[l], hours: site.hours[l] },
      groups: groups.map((g) => ({ ...g, name: t(g.name, l), short: t(g.short, l), tagline: t(g.tagline, l), countLabel: g.count ? `${g.count} ${d.common.courseCount}` : "" })),
      featured: courses.filter((c) => c.featured).map((c) => ({ ...c, name: t(c.name, l), summary: t(c.summary, l), groupName: gName(c.group) })),
      courses: courses.map((c) => ({ ...c, name: t(c.name, l), summary: t(c.summary, l), groupName: gName(c.group) })),
      graduates: graduates.map((g) => ({ ...g, name: t(g.name, l), courseName: t(courseNames[g.course], l) })),
      staff: staff.map((s) => ({ ...s, name: t(s.name, l), role: t(s.role, l) })),
      partners: partners.map((p) => ({ ...p, name: t(p.name, l) })),
      news: news.map((n) => ({ ...n, title: t(n.title, l), excerpt: t(n.excerpt, l), dateLabel: new Date(n.date).toLocaleDateString(l === "he" ? "he-IL" : "ar-EG", { year: "numeric", month: "long", day: "numeric" }) })),
      videos: videos.map((v) => ({ ...v, title: t(v.title, l) })),
      gallery,
      years: new Date().getFullYear() - site.foundedYear,
      courseCount: 11,
      groupCount: 5,
      partnerCount: 5,
      graduateCount: 16,
      alumniCount: 1500,
    };
  }

  window.ALMRKZ = { site, groups, courses, graduates, staff, partners, news, videos, gallery, dict, forLocale };
})();
