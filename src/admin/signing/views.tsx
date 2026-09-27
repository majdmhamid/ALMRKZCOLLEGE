import { DefaultTemplate } from '@payloadcms/next/templates'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import React from 'react'

import { LiveUpdates } from '@/features/signing/components/LiveUpdates'
import { PageHeader } from '@/features/signing/components/PageHeader'
import { DocumentsView } from '@/features/signing/components/documents/DocumentsView'
import { DocumentDetail } from '@/features/signing/components/editor/DocumentDetail'
import { SettingsForm } from '@/features/signing/components/settings/SettingsForm'
import { ToastProvider } from '@/features/signing/components/ui/Toast'
import { adminContext } from '@/features/signing/server/context'
import { documentStats, listCategories, listDocuments } from '@/features/signing/server/repo/documents'
import { recentNotifications, unreadCount } from '@/features/signing/server/repo/notifications'
import { getSettings } from '@/features/signing/server/repo/settings'
import { getSavedSignature } from '@/features/signing/server/services/admin'
import { loadEditor } from '@/features/signing/server/services/editor'
import '@/features/signing/styles/admin.css'

/**
 * صفحات التوقيع الإلكتروني داخل لوحة التحكم (/admin/documents، /admin/signed، /admin/settings).
 * بنفس القائمة الجانبية والشكل، وبنفس دخول اللوحة.
 */
function Frame({ props, children }: { props: AdminViewServerProps; children: React.ReactNode }) {
  const { initPageResult, params, searchParams } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
      viewType="dashboard"
    >
      <NextIntlClientProvider>
        <ToastProvider>
          <LiveUpdates />
          <div className="signing-scope gutter--left gutter--right" dir="rtl" style={{ paddingTop: 24, paddingBottom: 60 }}>
            {children}
          </div>
        </ToastProvider>
      </NextIntlClientProvider>
    </DefaultTemplate>
  )
}

async function listFor(section: 'active' | 'signed') {
  const { db } = await adminContext()
  const [docs, stats, unread, notifications, categories, settings] = await Promise.all([
    listDocuments(db, section),
    documentStats(db),
    unreadCount(db),
    recentNotifications(db),
    listCategories(db),
    getSettings(db),
  ])
  return (
    <DocumentsView
      section={section}
      docs={docs}
      stats={stats}
      unread={unread}
      notifications={notifications}
      categories={categories}
      defaultLinkMode={settings.default_link_mode}
    />
  )
}

export async function SigningDocumentsView(props: AdminViewServerProps) {
  return <Frame props={props}>{await listFor('active')}</Frame>
}

export async function SigningSignedView(props: AdminViewServerProps) {
  return <Frame props={props}>{await listFor('signed')}</Frame>
}

export async function SigningDocumentView(props: AdminViewServerProps) {
  const segments = (props.params?.segments as string[] | undefined) ?? []
  const id = segments[1] ?? ''
  const data = await loadEditor(await adminContext(), id)
  if (!data) notFound()
  return (
    <Frame props={props}>
      <DocumentDetail doc={data.doc} signatures={data.signatures} placements={data.placements} history={data.history} />
    </Frame>
  )
}

export async function SigningSettingsView(props: AdminViewServerProps) {
  const ctx = await adminContext()
  const t = await getTranslations('settingsPage')
  const [settings, saved] = await Promise.all([getSettings(ctx.db), getSavedSignature(ctx)])
  return (
    <Frame props={props}>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <SettingsForm initial={settings} savedSignatureUrl={saved?.url ?? null} />
    </Frame>
  )
}
