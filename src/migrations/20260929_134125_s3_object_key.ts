import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// The storage plugins (S3 / Vercel Blob) add a hidden `_objectKey` field to `media` — but only when
// they're switched on, so the initial migration (made without S3) missed it and the first Vercel
// build crashed on "column media._objectkey does not exist". IF NOT EXISTS: safe on any database.
// Make future migrations with the S3_* variables set, or `migrate:create` will want to drop it.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";`)
}
