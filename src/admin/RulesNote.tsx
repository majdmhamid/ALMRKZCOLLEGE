import React from 'react'

import { EMPLOYMENT_NOTICE, VOUCHER_TEXT } from '@/lib/rules'

/** Reminder box shown next to content that talks about courses and employment. */
export const RulesNote: React.FC = () => (
  <div
    style={{
      border: '1px solid var(--theme-warning-400, #e0a800)',
      background: 'var(--theme-warning-50, #fff8e1)',
      borderRadius: 6,
      padding: '12px 14px',
      marginBottom: 16,
      lineHeight: 1.7,
      fontSize: 13,
    }}
  >
    <strong>⚠️ قواعد ثابتة للموقع</strong>
    <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
      <li>ممنوع كتابة أي سعر.</li>
      <li>ممنوع أي صياغة توحي بضمان عمل («ضمان تشغيل»، «شغل مضمون»).</li>
      <li>
        المسموح: «مرافقة وتوجيه مهني بعد التخرّج». الموقع يضيف تلقائياً: «{EMPLOYMENT_NOTICE.ar}»
      </li>
      <li>نص المنحة ثابت: «{VOUCHER_TEXT.ar}»</li>
    </ul>
    <div style={{ marginTop: 6, opacity: 0.8 }}>
      إذا كتبت شيئاً ممنوعاً، اللوحة ترفض الحفظ وتشرح السبب.
    </div>
  </div>
)
