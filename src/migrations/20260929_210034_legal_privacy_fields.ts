import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" ADD COLUMN "marketing_consent" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "accessibility_coordinator_phone" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "accessibility_coordinator_email" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "accessibility_audit_date" timestamp(3) with time zone;
  ALTER TABLE "site_settings" ADD COLUMN "privacy_leads_retention_months" numeric DEFAULT 24;
  ALTER TABLE "site_settings" ADD COLUMN "privacy_contact_email" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "accessibility_coordinator_name" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "accessibility_coordinator_role" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "accessibility_building" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" DROP COLUMN "marketing_consent";
  ALTER TABLE "site_settings" DROP COLUMN "accessibility_coordinator_phone";
  ALTER TABLE "site_settings" DROP COLUMN "accessibility_coordinator_email";
  ALTER TABLE "site_settings" DROP COLUMN "accessibility_audit_date";
  ALTER TABLE "site_settings" DROP COLUMN "privacy_leads_retention_months";
  ALTER TABLE "site_settings" DROP COLUMN "privacy_contact_email";
  ALTER TABLE "site_settings_locales" DROP COLUMN "accessibility_coordinator_name";
  ALTER TABLE "site_settings_locales" DROP COLUMN "accessibility_coordinator_role";
  ALTER TABLE "site_settings_locales" DROP COLUMN "accessibility_building";`)
}
