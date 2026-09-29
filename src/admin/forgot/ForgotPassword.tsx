import { Link } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { emailIsSetUp, NO_EMAIL_MESSAGE } from '@/lib/email'

import { ForgotPasswordForm } from './ForgotPasswordForm'

/**
 * /admin/forgot. Payload's own page always said «تمّ إرسال البريد» — even with no email set up
 * on the site (SMTP), so nobody ever got a link. Without email: a clear note to ask an admin.
 * With email: the form, which now shows the server's message when sending fails.
 */
export function ForgotPassword({ initPageResult }: AdminViewServerProps) {
  const { i18n, payload, user } = initPageResult.req
  const admin = payload.config.routes.admin
  const he = i18n.language === 'he'

  if (user) {
    return (
      <div className="forgot-password__form">
        <h1>{i18n.t('authentication:alreadyLoggedIn')}</h1>
        <p>
          {he ? 'לשינוי הסיסמה: ' : 'لتغيير كلمة السر: '}
          <Link href={`${admin}${payload.config.admin.routes.account}`} prefetch={false}>
            {he ? 'החשבון שלי' : 'حسابي'}
          </Link>
        </p>
      </div>
    )
  }
  if (!emailIsSetUp()) {
    return (
      <div className="forgot-password__form">
        <h1>{i18n.t('authentication:forgotPassword')}</h1>
        <p>{he ? NO_EMAIL_MESSAGE.he : NO_EMAIL_MESSAGE.ar}</p>
        <p style={{ marginTop: 16 }}>
          <Link href={`${admin}${payload.config.admin.routes.login}`} prefetch={false}>
            {i18n.t('authentication:backToLogin')}
          </Link>
        </p>
      </div>
    )
  }
  return <ForgotPasswordForm />
}
