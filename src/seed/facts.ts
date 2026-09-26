/**
 * Course details that content.js does not list per course, taken from the
 * design's own FAQ answers (content.js → faq). Nothing here is invented.
 */
import type { L } from './optionA'

const ministryCert: { certificate: L; certifyingBody: L } = {
  certificate: { ar: 'شهادة بإشراف وزارة العمل', he: 'תעודה בפיקוח משרד העבודה' },
  certifyingBody: { ar: 'وزارة العمل', he: 'משרד העבודה' },
}

const collegeCert: { certificate: L; certifyingBody: L } = {
  certificate: {
    ar: 'شهادة من الكلية، مع إمكانية امتحان اعتماد دولي من معهد المواصفات',
    he: 'תעודה מהמכללה, עם אפשרות למבחן הסמכה בינלאומי של מכון התקנים',
  },
  certifyingBody: { ar: 'كلية المركز', he: 'מכללת המרכז' },
}

const openToBeginners = {
  age: { ar: 'من عمر 18', he: 'מגיל 18' },
  experience: { ar: 'لا حاجة لخبرة سابقة', he: 'לא נדרש ניסיון קודם' },
}

const constructionExperience = {
  experience: {
    ar: 'خبرة في البناء حسب القانون — نفحصها معك في لقاء التعارف',
    he: 'ניסיון בבנייה על פי חוק – נבדוק יחד בפגישת ההיכרות',
  },
}

const evening = {
  schedule: ['evening'] as const,
  scheduleDetails: { ar: '17:00–21:00', he: '17:00–21:00' },
}

export const courseFacts: Record<
  string,
  {
    certificate: L
    certifyingBody: L
    admission?: { age?: L; experience?: L }
    schedule: readonly ('morning' | 'evening')[]
    scheduleDetails: L
    certificateValue?: L
  }
> = {
  'welding-electrode-co2': { ...collegeCert, admission: openToBeginners, ...evening },
  'welding-argon': { ...collegeCert, admission: openToBeginners, ...evening },
  'hvac-technician-level-1': { ...ministryCert, admission: openToBeginners, ...evening },
  'site-manager': { ...ministryCert, admission: constructionExperience, ...evening },
  'safety-assistant': { ...ministryCert, admission: constructionExperience, ...evening },
  'scaffolding-builder': { ...ministryCert, admission: constructionExperience, ...evening },
  'self-loading-crane': { ...ministryCert, ...evening },
  'work-at-height': {
    ...ministryCert,
    admission: openToBeginners,
    schedule: ['morning'],
    scheduleDetails: { ar: 'يوم واحد 08:00–16:00', he: 'יום אחד 08:00–16:00' },
    certificateValue: { ar: 'التصريح ساري لسنتين.', he: 'האישור תקף לשנתיים.' },
  },
}

/** Courses that content.js only names (graduates took them) — saved as hidden drafts. */
export const extraCourseGroups: Record<string, string> = {
  'welding-pipes': 'welding',
  'hvac-technician-level-2': 'hvac',
}
