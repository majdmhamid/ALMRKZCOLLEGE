/**
 * تصحيحات للترجمة العربية الجاهزة تبعت Payload (i18n.translations بـ payload.config.ts).
 * فيها أخطاء إملائية، كلمات إنجليزية، و«locale» مترجمة «موقع» بدل «لغة».
 * بس المفاتيح اللي بتظهر لمجد وحسين — الباقي بضل من Payload.
 */
export const arTranslationFixes = {
  general: {
    // «أنشاء» غلط إملائي
    createNew: 'إنشاء جديد',
    // Payload فيها نص مش مترجم (تعليمات للمترجم) بدل الكلمة
    restoring: 'عم نرجّع النسخة…',
    // زر اللغة فوق: هي لغة النص اللي بتعدّله (عربي/עברית)، مش لغة اللوحة
    locale: 'لغة المحتوى',
    locales: 'اللغات',
    allLocales: 'كل اللغات',
    noResults: 'لسا ما في {{label}}.',
    fallbackToDefaultLocale: 'استعمل النص العربي',
  },
  fields: {
    toggleBlock: 'افتح / سكّر',
  },
  localization: {
    cannotCopySameLocale: 'ما بتقدر تنسخ لنفس اللغة',
    copyToLocale: 'انسخ للغة الثانية',
    localeToPublish: 'اللغة اللي بدك تنشرها',
    selectedLocales: 'اللغات المختارة',
    selectLocaleToCopy: 'اختار لأي لغة تنسخ',
    selectLocaleToDuplicate: 'اختار اللغات اللي بدك تنسخها',
  },
  version: {
    publishAllLocales: 'نشر بكل اللغات',
    aboutToUnpublish: 'رح يختفي من الموقع (بس بضل محفوظ هون وبتقدر ترجع تنشره). متأكد؟',
    currentlyViewing: 'النسخة اللي قدامك',
  },
  error: {
    // «عليك أن تقوم بتسجيل الدخول» كانت تطلع حتى لـ«محرّر» داخل، و«لا يسمح لك» كانت تطلع لما
    // تنتهي جلسة الدخول (مثلاً الكمبيوتر نام) — بدون ما يعرف إنه لازم يدخل من جديد
    unauthorized: 'ما إلك صلاحية لهاد الإشي: يا إما انتهت جلسة الدخول (ادخل من جديد)، يا إما بدها حساب «مدير».',
    notAllowedToPerformAction:
      'ما صار: يا إما انتهت جلسة الدخول، يا إما ما إلك صلاحية. افتح اللوحة بتبويب جديد وادخل من جديد (حتى ما يروح شغلك هون)، وبعدين جرّب كمان مرة.',
    followingFieldsInvalid_one: 'في خانة لازم تصلّحها:',
    followingFieldsInvalid_other: 'في خانات لازم تصلّحها:',
    correctInvalidFields: 'صلّح الخانات المعلّمة بالأحمر وجرّب كمان مرة.',
  },
  validation: {
    required: 'لازم تعبّي هاي الخانة.',
  },
}

/** نفس الفكرة للعبري: بدون اسم «Payload»، و«שפה» فوق هي لغة المحتوى مش لغة اللوحة. */
export const heTranslationFixes = {
  general: {
    payloadSettings: 'הגדרות',
    locale: 'שפת התוכן',
  },
}
