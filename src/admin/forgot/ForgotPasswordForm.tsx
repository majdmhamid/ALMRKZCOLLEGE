'use client'

import { EmailField, Form, FormSubmit, Link, useConfig, useTranslation } from '@payloadcms/ui'
import { email } from 'payload/shared'
import React, { useState } from 'react'

/**
 * «نسيت كلمة السر» — نفس نموذج Payload، بس لما السيرفر يرفض (مثلاً الإيميل مش مركّب، أو
 * الإرسال فشل) بتطلع رسالته، بدل «تمّ الإرسال» دايماً.
 */
export function ForgotPasswordForm() {
  const { config } = useConfig()
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const api = config.routes.api
  const admin = config.routes.admin
  const back = (
    <Link href={`${admin}${config.admin.routes.login}`} prefetch={false}>
      {t('authentication:backToLogin')}
    </Link>
  )

  if (sent) {
    return (
      <div className="forgot-password__form">
        <h1>{t('authentication:emailSent')}</h1>
        <p>{t('authentication:checkYourEmailForPasswordReset')}</p>
        {back}
      </div>
    )
  }
  return (
    <Form
      action={`${api}/${config.admin.user}/forgot-password`}
      className="forgot-password__form"
      disableSuccessStatus
      initialState={{ email: { initialValue: '', valid: true, value: undefined } }}
      method="POST"
      onSuccess={() => setSent(true)}
    >
      <h1>{t('authentication:forgotPassword')}</h1>
      <p>{t('authentication:forgotPasswordEmailInstructions')}</p>
      <EmailField
        field={{ name: 'email', label: t('general:email'), required: true, admin: { autoComplete: 'email' } }}
        path="email"
        validate={email}
      />
      <FormSubmit size="large">{t('general:submit')}</FormSubmit>
      <p style={{ marginTop: 16 }}>{back}</p>
    </Form>
  )
}
