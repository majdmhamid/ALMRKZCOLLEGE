import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ar', 'he');
  CREATE TYPE "public"."enum_courses_schedule" AS ENUM('morning', 'evening', 'weekend', 'online');
  CREATE TYPE "public"."enum_courses_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_version_schedule" AS ENUM('morning', 'evening', 'weekend', 'online');
  CREATE TYPE "public"."enum__courses_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__courses_v_published_locale" AS ENUM('ar', 'he');
  CREATE TYPE "public"."enum_course_groups_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__course_groups_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__course_groups_v_published_locale" AS ENUM('ar', 'he');
  CREATE TYPE "public"."enum_news_kind" AS ENUM('news', 'announcement', 'event');
  CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_version_kind" AS ENUM('news', 'announcement', 'event');
  CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_published_locale" AS ENUM('ar', 'he');
  CREATE TYPE "public"."enum_success_stories_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__success_stories_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__success_stories_v_published_locale" AS ENUM('ar', 'he');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'contacted', 'closed');
  CREATE TYPE "public"."enum_leads_locale" AS ENUM('ar', 'he');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_published_locale" AS ENUM('ar', 'he');
  CREATE TYPE "public"."enum_site_settings_social_platform" AS ENUM('facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'telegram', 'other');
  CREATE TYPE "public"."enum_navigation_header_items_children_link_type" AS ENUM('anchor', 'page', 'course', 'courseGroup', 'whatsapp', 'phone', 'external');
  CREATE TYPE "public"."enum_navigation_header_items_children_link_page" AS ENUM('home', 'courses', 'about', 'gallery', 'success-stories', 'news', 'companies', 'contact', 'staff', 'faq', 'register', 'accessibility');
  CREATE TYPE "public"."enum_navigation_header_items_link_type" AS ENUM('anchor', 'page', 'course', 'courseGroup', 'whatsapp', 'phone', 'external');
  CREATE TYPE "public"."enum_navigation_header_items_link_page" AS ENUM('home', 'courses', 'about', 'gallery', 'success-stories', 'news', 'companies', 'contact', 'staff', 'faq', 'register', 'accessibility');
  CREATE TYPE "public"."enum_navigation_footer_columns_links_link_type" AS ENUM('anchor', 'page', 'course', 'courseGroup', 'whatsapp', 'phone', 'external');
  CREATE TYPE "public"."enum_navigation_footer_columns_links_link_page" AS ENUM('home', 'courses', 'about', 'gallery', 'success-stories', 'news', 'companies', 'contact', 'staff', 'faq', 'register', 'accessibility');
  CREATE TYPE "public"."enum_navigation_footer_bottom_links_link_type" AS ENUM('anchor', 'page', 'course', 'courseGroup', 'whatsapp', 'phone', 'external');
  CREATE TYPE "public"."enum_navigation_footer_bottom_links_link_page" AS ENUM('home', 'courses', 'about', 'gallery', 'success-stories', 'news', 'companies', 'contact', 'staff', 'faq', 'register', 'accessibility');
  CREATE TYPE "public"."enum_navigation_header_cta_link_type" AS ENUM('anchor', 'page', 'course', 'courseGroup', 'whatsapp', 'phone', 'external');
  CREATE TYPE "public"."enum_navigation_header_cta_link_page" AS ENUM('home', 'courses', 'about', 'gallery', 'success-stories', 'news', 'companies', 'contact', 'staff', 'faq', 'register', 'accessibility');
  CREATE TABLE "courses_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_topics_locales" (
  	"topic" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_highlights_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses_schedule" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_courses_schedule",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_admission_other" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "courses_admission_other_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"group_id" integer,
  	"hours" numeric,
  	"sessions" numeric,
  	"next_start" timestamp(3) with time zone,
  	"voucher_eligible" boolean DEFAULT false,
  	"cover_image_id" integer,
  	"video_id" integer,
  	"video_poster_id" integer,
  	"youtube_url" varchar,
  	"seo_image_id" integer,
  	"featured" boolean DEFAULT false,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_courses_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "courses_locales" (
  	"name" varchar,
  	"short_description" varchar,
  	"full_description" jsonb,
  	"duration" varchar,
  	"schedule_details" varchar,
  	"next_start_note" varchar,
  	"certificate" varchar,
  	"certifying_body" varchar,
  	"certificate_value" varchar,
  	"admission_age" varchar,
  	"admission_education" varchar,
  	"admission_hebrew" varchar,
  	"admission_experience" varchar,
  	"career_guidance" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_courses_v_version_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_topics_locales" (
  	"topic" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_highlights_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_version_schedule" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__courses_v_version_schedule",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_courses_v_version_admission_other" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_admission_other_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_group_id" integer,
  	"version_hours" numeric,
  	"version_sessions" numeric,
  	"version_next_start" timestamp(3) with time zone,
  	"version_voucher_eligible" boolean DEFAULT false,
  	"version_cover_image_id" integer,
  	"version_video_id" integer,
  	"version_video_poster_id" integer,
  	"version_youtube_url" varchar,
  	"version_seo_image_id" integer,
  	"version_featured" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__courses_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__courses_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_courses_v_locales" (
  	"version_name" varchar,
  	"version_short_description" varchar,
  	"version_full_description" jsonb,
  	"version_duration" varchar,
  	"version_schedule_details" varchar,
  	"version_next_start_note" varchar,
  	"version_certificate" varchar,
  	"version_certifying_body" varchar,
  	"version_certificate_value" varchar,
  	"version_admission_age" varchar,
  	"version_admission_education" varchar,
  	"version_admission_hebrew" varchar,
  	"version_admission_experience" varchar,
  	"version_career_guidance" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_courses_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "course_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"icon_id" integer,
  	"seo_image_id" integer,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_course_groups_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "course_groups_locales" (
  	"name" varchar,
  	"short_name" varchar,
  	"tagline" varchar,
  	"description" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_course_groups_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_image_id" integer,
  	"version_icon_id" integer,
  	"version_seo_image_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__course_groups_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__course_groups_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_course_groups_v_locales" (
  	"version_name" varchar,
  	"version_short_name" varchar,
  	"version_tagline" varchar,
  	"version_description" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_news_kind" DEFAULT 'news',
  	"published_at" timestamp(3) with time zone,
  	"pinned" boolean DEFAULT false,
  	"cover_image_id" integer,
  	"seo_image_id" integer,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_kind" "enum__news_v_version_kind" DEFAULT 'news',
  	"version_published_at" timestamp(3) with time zone,
  	"version_pinned" boolean DEFAULT false,
  	"version_cover_image_id" integer,
  	"version_seo_image_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__news_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_news_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"courses_id" integer
  );
  
  CREATE TABLE "success_stories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"graduation_year" numeric,
  	"photo_id" integer,
  	"video_id" integer,
  	"video_duration" varchar,
  	"featured" boolean DEFAULT false,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_success_stories_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "success_stories_locales" (
  	"graduate_name" varchar,
  	"quote" varchar,
  	"excerpt" varchar,
  	"current_role" varchar,
  	"story" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_success_stories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_course_id" integer,
  	"version_graduation_year" numeric,
  	"version_photo_id" integer,
  	"version_video_id" integer,
  	"version_video_duration" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__success_stories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__success_stories_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_success_stories_v_locales" (
  	"version_graduate_name" varchar,
  	"version_quote" varchar,
  	"version_excerpt" varchar,
  	"version_current_role" varchar,
  	"version_story" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "staff" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "staff_locales" (
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer NOT NULL,
  	"url" varchar,
  	"slug" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partners_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_file" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_wide_url" varchar,
  	"sizes_wide_width" numeric,
  	"sizes_wide_height" numeric,
  	"sizes_wide_mime_type" varchar,
  	"sizes_wide_filesize" numeric,
  	"sizes_wide_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"course_id" integer,
  	"course_other" varchar,
  	"message" varchar,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"internal_notes" varchar,
  	"locale" "enum_leads_locale" DEFAULT 'ar',
  	"source_page" varchar,
  	"website" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"courses_id" integer,
  	"course_groups_id" integer,
  	"news_id" integer,
  	"success_stories_id" integer,
  	"staff_id" integer,
  	"partners_id" integer,
  	"media_id" integer,
  	"leads_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"poster_id" integer,
  	"show_groups_strip" boolean DEFAULT true,
  	"anchor" varchar DEFAULT 'top',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_hero_locales" (
  	"badge" varchar,
  	"title" varchar,
  	"kicker" varchar,
  	"text" varchar,
  	"subtitle" varchar,
  	"slogan" varchar,
  	"whatsapp_button" varchar,
  	"register_button" varchar,
  	"courses_link" varchar,
  	"scroll_hint" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"suffix" varchar DEFAULT '+',
  	"anchor" varchar
  );
  
  CREATE TABLE "homepage_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'stats',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_course_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'fields',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_course_groups_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"swipe_hint" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_featured_courses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'courses',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_featured_courses_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"all_courses_button" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_why_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_why_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_why_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_why_pills_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_why" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"badge_number" varchar,
  	"anchor" varchar DEFAULT 'why',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_why_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"badge_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_success_stories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rotate_seconds" numeric DEFAULT 6.5,
  	"anchor" varchar DEFAULT 'graduates',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_success_stories_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"video_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_staff" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'staff',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_staff_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_videos_reels" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"poster_id" integer,
  	"video_id" integer,
  	"duration_label" varchar,
  	"course_id" integer
  );
  
  CREATE TABLE "homepage_blocks_videos_reels_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"promo_video_id" integer,
  	"promo_youtube_url" varchar,
  	"promo_poster_id" integer,
  	"promo_duration_label" varchar,
  	"anchor" varchar DEFAULT 'video',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_videos_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"promo_kind" varchar,
  	"promo_title" varchar,
  	"promo_subtitle" varchar,
  	"promo_play_label" varchar,
  	"whatsapp_message" varchar,
  	"swipe_hint" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"count" numeric DEFAULT 3,
  	"anchor" varchar DEFAULT 'news',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_news_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'partners',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_partners_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_employers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_employers_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_employers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'employers',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_employers_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"whatsapp_button" varchar,
  	"hiring_button" varchar,
  	"hiring_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'faq',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_faq_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_register_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_register_bullets_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_register" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_voucher_note" boolean DEFAULT true,
  	"anchor" varchar DEFAULT 'register',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_register_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"whatsapp_button" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"count" numeric DEFAULT 10,
  	"anchor" varchar DEFAULT 'gallery',
  	"hidden" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_gallery_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_homepage_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"course_groups_id" integer,
  	"courses_id" integer,
  	"success_stories_id" integer,
  	"staff_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "_homepage_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"video_id" integer,
  	"poster_id" integer,
  	"show_groups_strip" boolean DEFAULT true,
  	"anchor" varchar DEFAULT 'top',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_hero_locales" (
  	"badge" varchar,
  	"title" varchar,
  	"kicker" varchar,
  	"text" varchar,
  	"subtitle" varchar,
  	"slogan" varchar,
  	"whatsapp_button" varchar,
  	"register_button" varchar,
  	"courses_link" varchar,
  	"scroll_hint" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" numeric,
  	"suffix" varchar DEFAULT '+',
  	"anchor" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_stats_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'stats',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_course_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'fields',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_course_groups_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"swipe_hint" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_featured_courses" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'courses',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_featured_courses_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"all_courses_button" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_why_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_why_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_why_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_why_pills_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_why" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"badge_number" varchar,
  	"anchor" varchar DEFAULT 'why',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_why_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"badge_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_success_stories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rotate_seconds" numeric DEFAULT 6.5,
  	"anchor" varchar DEFAULT 'graduates',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_success_stories_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"video_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_staff" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'staff',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_staff_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_videos_reels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"poster_id" integer,
  	"video_id" integer,
  	"duration_label" varchar,
  	"course_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_videos_reels_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"promo_video_id" integer,
  	"promo_youtube_url" varchar,
  	"promo_poster_id" integer,
  	"promo_duration_label" varchar,
  	"anchor" varchar DEFAULT 'video',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_videos_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"promo_kind" varchar,
  	"promo_title" varchar,
  	"promo_subtitle" varchar,
  	"promo_play_label" varchar,
  	"whatsapp_message" varchar,
  	"swipe_hint" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"count" numeric DEFAULT 3,
  	"anchor" varchar DEFAULT 'news',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_news_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_partners" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'partners',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_partners_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_employers_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_employers_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_employers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'employers',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_employers_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"whatsapp_button" varchar,
  	"hiring_button" varchar,
  	"hiring_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_faq_items_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"anchor" varchar DEFAULT 'faq',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_faq_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_register_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_register_bullets_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_register" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_voucher_note" boolean DEFAULT true,
  	"anchor" varchar DEFAULT 'register',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_register_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"text" varchar,
  	"whatsapp_button" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"count" numeric DEFAULT 10,
  	"anchor" varchar DEFAULT 'gallery',
  	"hidden" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_gallery_locales" (
  	"kicker" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__homepage_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_homepage_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"course_groups_id" integer,
  	"courses_id" integer,
  	"success_stories_id" integer,
  	"staff_id" integer,
  	"partners_id" integer
  );
  
  CREATE TABLE "ui_texts_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ui_texts_trust_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ui_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ui_texts_locales" (
  	"other_lang" varchar,
  	"a11y" varchar,
  	"nav_home" varchar,
  	"nav_courses" varchar,
  	"nav_all_courses" varchar,
  	"nav_about" varchar,
  	"nav_graduates" varchar,
  	"nav_gallery" varchar,
  	"nav_news" varchar,
  	"nav_employers" varchar,
  	"nav_contact" varchar,
  	"nav_faq" varchar,
  	"nav_staff" varchar,
  	"nav_menu" varchar,
  	"nav_close" varchar,
  	"page_titles_graduates_title" varchar,
  	"common_read_more" varchar,
  	"common_view_course" varchar,
  	"common_all_courses" varchar,
  	"common_contact_us" varchar,
  	"common_whatsapp" varchar,
  	"common_whatsapp_long" varchar,
  	"common_whatsapp_contact" varchar,
  	"common_call" varchar,
  	"common_register_interest" varchar,
  	"common_hours" varchar,
  	"common_sessions" varchar,
  	"common_course_count" varchar,
  	"common_evening" varchar,
  	"common_next_start" varchar,
  	"common_swipe" varchar,
  	"stats_years" varchar,
  	"stats_courses" varchar,
  	"stats_groups" varchar,
  	"stats_partners" varchar,
  	"stats_graduates" varchar,
  	"stats_alumni" varchar,
  	"form_name" varchar,
  	"form_phone" varchar,
  	"form_email" varchar,
  	"form_course" varchar,
  	"form_course_select" varchar,
  	"form_course_any" varchar,
  	"form_message" varchar,
  	"form_submit" varchar,
  	"form_privacy" varchar,
  	"form_success_title" varchar,
  	"form_success_text" varchar,
  	"course_contact_for_price" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "gallery_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"youtube_url" varchar,
  	"file_id" integer,
  	"thumbnail_id" integer
  );
  
  CREATE TABLE "gallery_videos_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "gallery" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "gallery_locales" (
  	"title" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "gallery_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "site_settings_contact_phones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar NOT NULL,
  	"show_in_header" boolean DEFAULT false
  );
  
  CREATE TABLE "site_settings_contact_phones_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_contact_opening_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings_contact_opening_hours_locales" (
  	"days" varchar NOT NULL,
  	"hours" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_leads_notification_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"founded_year" numeric DEFAULT 2008,
  	"logo_light_id" integer,
  	"logo_dark_id" integer,
  	"logo_mark_id" integer,
  	"favicon_id" integer,
  	"contact_whatsapp" varchar,
  	"contact_email" varchar,
  	"contact_map_url" varchar,
  	"contact_map_embed_url" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"site_name" varchar NOT NULL,
  	"short_name" varchar,
  	"tagline" varchar,
  	"city" varchar,
  	"accreditation" varchar,
  	"contact_whatsapp_message" varchar,
  	"contact_address" varchar,
  	"seo_title_template" varchar,
  	"seo_default_title" varchar,
  	"seo_default_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_header_items_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_header_items_children_link_type" DEFAULT 'anchor',
  	"link_page" "enum_navigation_header_items_children_link_page",
  	"link_anchor" varchar,
  	"link_course_id" integer,
  	"link_course_group_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_header_items_children_locales" (
  	"label" varchar NOT NULL,
  	"link_whatsapp_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_header_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_header_items_link_type" DEFAULT 'anchor',
  	"link_page" "enum_navigation_header_items_link_page",
  	"link_anchor" varchar,
  	"link_course_id" integer,
  	"link_course_group_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_header_items_locales" (
  	"label" varchar NOT NULL,
  	"link_whatsapp_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_footer_columns_links_link_type" DEFAULT 'anchor',
  	"link_page" "enum_navigation_footer_columns_links_link_page",
  	"link_anchor" varchar,
  	"link_course_id" integer,
  	"link_course_group_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_footer_columns_links_locales" (
  	"label" varchar NOT NULL,
  	"link_whatsapp_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "navigation_footer_columns_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_footer_bottom_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_navigation_footer_bottom_links_link_type" DEFAULT 'anchor',
  	"link_page" "enum_navigation_footer_bottom_links_link_page",
  	"link_anchor" varchar,
  	"link_course_id" integer,
  	"link_course_group_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_footer_bottom_links_locales" (
  	"label" varchar NOT NULL,
  	"link_whatsapp_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_cta_show" boolean DEFAULT true,
  	"header_cta_link_type" "enum_navigation_header_cta_link_type" DEFAULT 'anchor',
  	"header_cta_link_page" "enum_navigation_header_cta_link_page",
  	"header_cta_link_anchor" varchar,
  	"header_cta_link_course_id" integer,
  	"header_cta_link_course_group_id" integer,
  	"header_cta_link_url" varchar,
  	"header_cta_link_new_tab" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_locales" (
  	"header_cta_label" varchar,
  	"header_cta_link_whatsapp_message" varchar,
  	"footer_about" varchar,
  	"footer_contact_title" varchar,
  	"footer_copyright" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "courses_topics" ADD CONSTRAINT "courses_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_topics_locales" ADD CONSTRAINT "courses_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_highlights" ADD CONSTRAINT "courses_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_highlights_locales" ADD CONSTRAINT "courses_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_schedule" ADD CONSTRAINT "courses_schedule_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_admission_other" ADD CONSTRAINT "courses_admission_other_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_admission_other_locales" ADD CONSTRAINT "courses_admission_other_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_admission_other"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_group_id_course_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_video_poster_id_media_id_fk" FOREIGN KEY ("video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_locales" ADD CONSTRAINT "courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_topics" ADD CONSTRAINT "_courses_v_version_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_topics_locales" ADD CONSTRAINT "_courses_v_version_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_highlights" ADD CONSTRAINT "_courses_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_highlights_locales" ADD CONSTRAINT "_courses_v_version_highlights_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_schedule" ADD CONSTRAINT "_courses_v_version_schedule_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_admission_other" ADD CONSTRAINT "_courses_v_version_admission_other_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_admission_other_locales" ADD CONSTRAINT "_courses_v_version_admission_other_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_admission_other"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_parent_id_courses_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_group_id_course_groups_id_fk" FOREIGN KEY ("version_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_video_id_media_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_video_poster_id_media_id_fk" FOREIGN KEY ("version_video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v" ADD CONSTRAINT "_courses_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_locales" ADD CONSTRAINT "_courses_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_courses_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_rels" ADD CONSTRAINT "_courses_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_groups" ADD CONSTRAINT "course_groups_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_groups_locales" ADD CONSTRAINT "course_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_course_groups_v" ADD CONSTRAINT "_course_groups_v_parent_id_course_groups_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_groups_v" ADD CONSTRAINT "_course_groups_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_groups_v" ADD CONSTRAINT "_course_groups_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_groups_v" ADD CONSTRAINT "_course_groups_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_groups_v_locales" ADD CONSTRAINT "_course_groups_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_course_groups_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_locales" ADD CONSTRAINT "news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_locales" ADD CONSTRAINT "_news_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "success_stories" ADD CONSTRAINT "success_stories_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "success_stories_locales" ADD CONSTRAINT "success_stories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."success_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_success_stories_v" ADD CONSTRAINT "_success_stories_v_parent_id_success_stories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."success_stories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_success_stories_v" ADD CONSTRAINT "_success_stories_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_success_stories_v" ADD CONSTRAINT "_success_stories_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_success_stories_v" ADD CONSTRAINT "_success_stories_v_version_video_id_media_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_success_stories_v_locales" ADD CONSTRAINT "_success_stories_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_success_stories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "staff" ADD CONSTRAINT "staff_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "staff_locales" ADD CONSTRAINT "staff_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_locales" ADD CONSTRAINT "partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_groups_fk" FOREIGN KEY ("course_groups_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_success_stories_fk" FOREIGN KEY ("success_stories_id") REFERENCES "public"."success_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero_locales" ADD CONSTRAINT "homepage_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_stats_items" ADD CONSTRAINT "homepage_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_stats_items_locales" ADD CONSTRAINT "homepage_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_stats" ADD CONSTRAINT "homepage_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_course_groups" ADD CONSTRAINT "homepage_blocks_course_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_course_groups_locales" ADD CONSTRAINT "homepage_blocks_course_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_courses" ADD CONSTRAINT "homepage_blocks_featured_courses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_featured_courses_locales" ADD CONSTRAINT "homepage_blocks_featured_courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_featured_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_why_items" ADD CONSTRAINT "homepage_blocks_why_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_why"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_why_items_locales" ADD CONSTRAINT "homepage_blocks_why_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_why_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_why_pills" ADD CONSTRAINT "homepage_blocks_why_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_why"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_why_pills_locales" ADD CONSTRAINT "homepage_blocks_why_pills_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_why_pills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_why" ADD CONSTRAINT "homepage_blocks_why_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_why" ADD CONSTRAINT "homepage_blocks_why_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_why_locales" ADD CONSTRAINT "homepage_blocks_why_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_why"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_success_stories" ADD CONSTRAINT "homepage_blocks_success_stories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_success_stories_locales" ADD CONSTRAINT "homepage_blocks_success_stories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_success_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_staff" ADD CONSTRAINT "homepage_blocks_staff_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_staff_locales" ADD CONSTRAINT "homepage_blocks_staff_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos_reels" ADD CONSTRAINT "homepage_blocks_videos_reels_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos_reels" ADD CONSTRAINT "homepage_blocks_videos_reels_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos_reels" ADD CONSTRAINT "homepage_blocks_videos_reels_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos_reels" ADD CONSTRAINT "homepage_blocks_videos_reels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos_reels_locales" ADD CONSTRAINT "homepage_blocks_videos_reels_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_videos_reels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos" ADD CONSTRAINT "homepage_blocks_videos_promo_video_id_media_id_fk" FOREIGN KEY ("promo_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos" ADD CONSTRAINT "homepage_blocks_videos_promo_poster_id_media_id_fk" FOREIGN KEY ("promo_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos" ADD CONSTRAINT "homepage_blocks_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_videos_locales" ADD CONSTRAINT "homepage_blocks_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_news" ADD CONSTRAINT "homepage_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_news_locales" ADD CONSTRAINT "homepage_blocks_news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_partners" ADD CONSTRAINT "homepage_blocks_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_partners_locales" ADD CONSTRAINT "homepage_blocks_partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_employers_items" ADD CONSTRAINT "homepage_blocks_employers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_employers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_employers_items_locales" ADD CONSTRAINT "homepage_blocks_employers_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_employers_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_employers" ADD CONSTRAINT "homepage_blocks_employers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_employers_locales" ADD CONSTRAINT "homepage_blocks_employers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_employers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faq_items" ADD CONSTRAINT "homepage_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faq_items_locales" ADD CONSTRAINT "homepage_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faq" ADD CONSTRAINT "homepage_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_faq_locales" ADD CONSTRAINT "homepage_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_register_bullets" ADD CONSTRAINT "homepage_blocks_register_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_register"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_register_bullets_locales" ADD CONSTRAINT "homepage_blocks_register_bullets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_register_bullets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_register" ADD CONSTRAINT "homepage_blocks_register_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_register_locales" ADD CONSTRAINT "homepage_blocks_register_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_register"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_gallery" ADD CONSTRAINT "homepage_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_gallery_locales" ADD CONSTRAINT "homepage_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_course_groups_fk" FOREIGN KEY ("course_groups_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_success_stories_fk" FOREIGN KEY ("success_stories_id") REFERENCES "public"."success_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero_locales" ADD CONSTRAINT "_homepage_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_stats_items" ADD CONSTRAINT "_homepage_v_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_stats_items_locales" ADD CONSTRAINT "_homepage_v_blocks_stats_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_stats_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_stats" ADD CONSTRAINT "_homepage_v_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_course_groups" ADD CONSTRAINT "_homepage_v_blocks_course_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_course_groups_locales" ADD CONSTRAINT "_homepage_v_blocks_course_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_featured_courses" ADD CONSTRAINT "_homepage_v_blocks_featured_courses_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_featured_courses_locales" ADD CONSTRAINT "_homepage_v_blocks_featured_courses_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_featured_courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_why_items" ADD CONSTRAINT "_homepage_v_blocks_why_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_why"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_why_items_locales" ADD CONSTRAINT "_homepage_v_blocks_why_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_why_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_why_pills" ADD CONSTRAINT "_homepage_v_blocks_why_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_why"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_why_pills_locales" ADD CONSTRAINT "_homepage_v_blocks_why_pills_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_why_pills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_why" ADD CONSTRAINT "_homepage_v_blocks_why_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_why" ADD CONSTRAINT "_homepage_v_blocks_why_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_why_locales" ADD CONSTRAINT "_homepage_v_blocks_why_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_why"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_success_stories" ADD CONSTRAINT "_homepage_v_blocks_success_stories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_success_stories_locales" ADD CONSTRAINT "_homepage_v_blocks_success_stories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_success_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_staff" ADD CONSTRAINT "_homepage_v_blocks_staff_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_staff_locales" ADD CONSTRAINT "_homepage_v_blocks_staff_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos_reels" ADD CONSTRAINT "_homepage_v_blocks_videos_reels_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos_reels" ADD CONSTRAINT "_homepage_v_blocks_videos_reels_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos_reels" ADD CONSTRAINT "_homepage_v_blocks_videos_reels_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos_reels" ADD CONSTRAINT "_homepage_v_blocks_videos_reels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos_reels_locales" ADD CONSTRAINT "_homepage_v_blocks_videos_reels_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_videos_reels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos" ADD CONSTRAINT "_homepage_v_blocks_videos_promo_video_id_media_id_fk" FOREIGN KEY ("promo_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos" ADD CONSTRAINT "_homepage_v_blocks_videos_promo_poster_id_media_id_fk" FOREIGN KEY ("promo_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos" ADD CONSTRAINT "_homepage_v_blocks_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_videos_locales" ADD CONSTRAINT "_homepage_v_blocks_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_news" ADD CONSTRAINT "_homepage_v_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_news_locales" ADD CONSTRAINT "_homepage_v_blocks_news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_partners" ADD CONSTRAINT "_homepage_v_blocks_partners_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_partners_locales" ADD CONSTRAINT "_homepage_v_blocks_partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_employers_items" ADD CONSTRAINT "_homepage_v_blocks_employers_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_employers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_employers_items_locales" ADD CONSTRAINT "_homepage_v_blocks_employers_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_employers_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_employers" ADD CONSTRAINT "_homepage_v_blocks_employers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_employers_locales" ADD CONSTRAINT "_homepage_v_blocks_employers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_employers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faq_items" ADD CONSTRAINT "_homepage_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faq_items_locales" ADD CONSTRAINT "_homepage_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faq" ADD CONSTRAINT "_homepage_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_faq_locales" ADD CONSTRAINT "_homepage_v_blocks_faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_register_bullets" ADD CONSTRAINT "_homepage_v_blocks_register_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_register"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_register_bullets_locales" ADD CONSTRAINT "_homepage_v_blocks_register_bullets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_register_bullets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_register" ADD CONSTRAINT "_homepage_v_blocks_register_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_register_locales" ADD CONSTRAINT "_homepage_v_blocks_register_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_register"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_gallery" ADD CONSTRAINT "_homepage_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_gallery_locales" ADD CONSTRAINT "_homepage_v_blocks_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_course_groups_fk" FOREIGN KEY ("course_groups_id") REFERENCES "public"."course_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_success_stories_fk" FOREIGN KEY ("success_stories_id") REFERENCES "public"."success_stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_staff_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ui_texts_trust" ADD CONSTRAINT "ui_texts_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ui_texts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ui_texts_trust_locales" ADD CONSTRAINT "ui_texts_trust_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ui_texts_trust"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ui_texts_locales" ADD CONSTRAINT "ui_texts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ui_texts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_videos" ADD CONSTRAINT "gallery_videos_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_videos" ADD CONSTRAINT "gallery_videos_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_videos" ADD CONSTRAINT "gallery_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_videos_locales" ADD CONSTRAINT "gallery_videos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery_videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_locales" ADD CONSTRAINT "gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_rels" ADD CONSTRAINT "gallery_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_rels" ADD CONSTRAINT "gallery_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_phones" ADD CONSTRAINT "site_settings_contact_phones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_phones_locales" ADD CONSTRAINT "site_settings_contact_phones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_contact_phones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_opening_hours" ADD CONSTRAINT "site_settings_contact_opening_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_opening_hours_locales" ADD CONSTRAINT "site_settings_contact_opening_hours_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_contact_opening_hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social" ADD CONSTRAINT "site_settings_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_leads_notification_emails" ADD CONSTRAINT "site_settings_leads_notification_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_light_id_media_id_fk" FOREIGN KEY ("logo_light_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_dark_id_media_id_fk" FOREIGN KEY ("logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_mark_id_media_id_fk" FOREIGN KEY ("logo_mark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_items_children" ADD CONSTRAINT "navigation_header_items_children_link_course_id_courses_id_fk" FOREIGN KEY ("link_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_items_children" ADD CONSTRAINT "navigation_header_items_children_link_course_group_id_course_groups_id_fk" FOREIGN KEY ("link_course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_items_children" ADD CONSTRAINT "navigation_header_items_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_items_children_locales" ADD CONSTRAINT "navigation_header_items_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_items_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_items" ADD CONSTRAINT "navigation_header_items_link_course_id_courses_id_fk" FOREIGN KEY ("link_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_items" ADD CONSTRAINT "navigation_header_items_link_course_group_id_course_groups_id_fk" FOREIGN KEY ("link_course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_header_items" ADD CONSTRAINT "navigation_header_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_header_items_locales" ADD CONSTRAINT "navigation_header_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_header_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_link_course_id_courses_id_fk" FOREIGN KEY ("link_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_link_course_group_id_course_groups_id_fk" FOREIGN KEY ("link_course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_links_locales" ADD CONSTRAINT "navigation_footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns" ADD CONSTRAINT "navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_columns_locales" ADD CONSTRAINT "navigation_footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_bottom_links" ADD CONSTRAINT "navigation_footer_bottom_links_link_course_id_courses_id_fk" FOREIGN KEY ("link_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_bottom_links" ADD CONSTRAINT "navigation_footer_bottom_links_link_course_group_id_course_groups_id_fk" FOREIGN KEY ("link_course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_footer_bottom_links" ADD CONSTRAINT "navigation_footer_bottom_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_footer_bottom_links_locales" ADD CONSTRAINT "navigation_footer_bottom_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_footer_bottom_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation" ADD CONSTRAINT "navigation_header_cta_link_course_id_courses_id_fk" FOREIGN KEY ("header_cta_link_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation" ADD CONSTRAINT "navigation_header_cta_link_course_group_id_course_groups_id_fk" FOREIGN KEY ("header_cta_link_course_group_id") REFERENCES "public"."course_groups"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "navigation_locales" ADD CONSTRAINT "navigation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_topics_order_idx" ON "courses_topics" USING btree ("_order");
  CREATE INDEX "courses_topics_parent_id_idx" ON "courses_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_topics_locales_locale_parent_id_unique" ON "courses_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_highlights_order_idx" ON "courses_highlights" USING btree ("_order");
  CREATE INDEX "courses_highlights_parent_id_idx" ON "courses_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_highlights_locales_locale_parent_id_unique" ON "courses_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_schedule_order_idx" ON "courses_schedule" USING btree ("order");
  CREATE INDEX "courses_schedule_parent_idx" ON "courses_schedule" USING btree ("parent_id");
  CREATE INDEX "courses_admission_other_order_idx" ON "courses_admission_other" USING btree ("_order");
  CREATE INDEX "courses_admission_other_parent_id_idx" ON "courses_admission_other" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "courses_admission_other_locales_locale_parent_id_unique" ON "courses_admission_other_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_group_idx" ON "courses" USING btree ("group_id");
  CREATE INDEX "courses_voucher_eligible_idx" ON "courses" USING btree ("voucher_eligible");
  CREATE INDEX "courses_cover_image_idx" ON "courses" USING btree ("cover_image_id");
  CREATE INDEX "courses_video_idx" ON "courses" USING btree ("video_id");
  CREATE INDEX "courses_video_poster_idx" ON "courses" USING btree ("video_poster_id");
  CREATE INDEX "courses_seo_seo_image_idx" ON "courses" USING btree ("seo_image_id");
  CREATE INDEX "courses_featured_idx" ON "courses" USING btree ("featured");
  CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");
  CREATE INDEX "courses_order_idx" ON "courses" USING btree ("order");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE INDEX "courses__status_idx" ON "courses" USING btree ("_status");
  CREATE UNIQUE INDEX "courses_locales_locale_parent_id_unique" ON "courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_media_id_idx" ON "courses_rels" USING btree ("media_id");
  CREATE INDEX "_courses_v_version_topics_order_idx" ON "_courses_v_version_topics" USING btree ("_order");
  CREATE INDEX "_courses_v_version_topics_parent_id_idx" ON "_courses_v_version_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_version_topics_locales_locale_parent_id_unique" ON "_courses_v_version_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_version_highlights_order_idx" ON "_courses_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_courses_v_version_highlights_parent_id_idx" ON "_courses_v_version_highlights" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_version_highlights_locales_locale_parent_id_uniqu" ON "_courses_v_version_highlights_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_version_schedule_order_idx" ON "_courses_v_version_schedule" USING btree ("order");
  CREATE INDEX "_courses_v_version_schedule_parent_idx" ON "_courses_v_version_schedule" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_admission_other_order_idx" ON "_courses_v_version_admission_other" USING btree ("_order");
  CREATE INDEX "_courses_v_version_admission_other_parent_id_idx" ON "_courses_v_version_admission_other" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_courses_v_version_admission_other_locales_locale_parent_id_" ON "_courses_v_version_admission_other_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_parent_idx" ON "_courses_v" USING btree ("parent_id");
  CREATE INDEX "_courses_v_version_version_group_idx" ON "_courses_v" USING btree ("version_group_id");
  CREATE INDEX "_courses_v_version_version_voucher_eligible_idx" ON "_courses_v" USING btree ("version_voucher_eligible");
  CREATE INDEX "_courses_v_version_version_cover_image_idx" ON "_courses_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_courses_v_version_version_video_idx" ON "_courses_v" USING btree ("version_video_id");
  CREATE INDEX "_courses_v_version_version_video_poster_idx" ON "_courses_v" USING btree ("version_video_poster_id");
  CREATE INDEX "_courses_v_version_seo_version_seo_image_idx" ON "_courses_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_courses_v_version_version_featured_idx" ON "_courses_v" USING btree ("version_featured");
  CREATE INDEX "_courses_v_version_version_slug_idx" ON "_courses_v" USING btree ("version_slug");
  CREATE INDEX "_courses_v_version_version_order_idx" ON "_courses_v" USING btree ("version_order");
  CREATE INDEX "_courses_v_version_version_updated_at_idx" ON "_courses_v" USING btree ("version_updated_at");
  CREATE INDEX "_courses_v_version_version_created_at_idx" ON "_courses_v" USING btree ("version_created_at");
  CREATE INDEX "_courses_v_version_version__status_idx" ON "_courses_v" USING btree ("version__status");
  CREATE INDEX "_courses_v_created_at_idx" ON "_courses_v" USING btree ("created_at");
  CREATE INDEX "_courses_v_updated_at_idx" ON "_courses_v" USING btree ("updated_at");
  CREATE INDEX "_courses_v_snapshot_idx" ON "_courses_v" USING btree ("snapshot");
  CREATE INDEX "_courses_v_published_locale_idx" ON "_courses_v" USING btree ("published_locale");
  CREATE INDEX "_courses_v_latest_idx" ON "_courses_v" USING btree ("latest");
  CREATE INDEX "_courses_v_autosave_idx" ON "_courses_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_courses_v_locales_locale_parent_id_unique" ON "_courses_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_courses_v_rels_order_idx" ON "_courses_v_rels" USING btree ("order");
  CREATE INDEX "_courses_v_rels_parent_idx" ON "_courses_v_rels" USING btree ("parent_id");
  CREATE INDEX "_courses_v_rels_path_idx" ON "_courses_v_rels" USING btree ("path");
  CREATE INDEX "_courses_v_rels_media_id_idx" ON "_courses_v_rels" USING btree ("media_id");
  CREATE INDEX "course_groups_image_idx" ON "course_groups" USING btree ("image_id");
  CREATE INDEX "course_groups_icon_idx" ON "course_groups" USING btree ("icon_id");
  CREATE INDEX "course_groups_seo_seo_image_idx" ON "course_groups" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "course_groups_slug_idx" ON "course_groups" USING btree ("slug");
  CREATE INDEX "course_groups_order_idx" ON "course_groups" USING btree ("order");
  CREATE INDEX "course_groups_updated_at_idx" ON "course_groups" USING btree ("updated_at");
  CREATE INDEX "course_groups_created_at_idx" ON "course_groups" USING btree ("created_at");
  CREATE INDEX "course_groups__status_idx" ON "course_groups" USING btree ("_status");
  CREATE UNIQUE INDEX "course_groups_locales_locale_parent_id_unique" ON "course_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_course_groups_v_parent_idx" ON "_course_groups_v" USING btree ("parent_id");
  CREATE INDEX "_course_groups_v_version_version_image_idx" ON "_course_groups_v" USING btree ("version_image_id");
  CREATE INDEX "_course_groups_v_version_version_icon_idx" ON "_course_groups_v" USING btree ("version_icon_id");
  CREATE INDEX "_course_groups_v_version_seo_version_seo_image_idx" ON "_course_groups_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_course_groups_v_version_version_slug_idx" ON "_course_groups_v" USING btree ("version_slug");
  CREATE INDEX "_course_groups_v_version_version_order_idx" ON "_course_groups_v" USING btree ("version_order");
  CREATE INDEX "_course_groups_v_version_version_updated_at_idx" ON "_course_groups_v" USING btree ("version_updated_at");
  CREATE INDEX "_course_groups_v_version_version_created_at_idx" ON "_course_groups_v" USING btree ("version_created_at");
  CREATE INDEX "_course_groups_v_version_version__status_idx" ON "_course_groups_v" USING btree ("version__status");
  CREATE INDEX "_course_groups_v_created_at_idx" ON "_course_groups_v" USING btree ("created_at");
  CREATE INDEX "_course_groups_v_updated_at_idx" ON "_course_groups_v" USING btree ("updated_at");
  CREATE INDEX "_course_groups_v_snapshot_idx" ON "_course_groups_v" USING btree ("snapshot");
  CREATE INDEX "_course_groups_v_published_locale_idx" ON "_course_groups_v" USING btree ("published_locale");
  CREATE INDEX "_course_groups_v_latest_idx" ON "_course_groups_v" USING btree ("latest");
  CREATE INDEX "_course_groups_v_autosave_idx" ON "_course_groups_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_course_groups_v_locales_locale_parent_id_unique" ON "_course_groups_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_cover_image_idx" ON "news" USING btree ("cover_image_id");
  CREATE INDEX "news_seo_seo_image_idx" ON "news" USING btree ("seo_image_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");
  CREATE UNIQUE INDEX "news_locales_locale_parent_id_unique" ON "news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_rels_order_idx" ON "news_rels" USING btree ("order");
  CREATE INDEX "news_rels_parent_idx" ON "news_rels" USING btree ("parent_id");
  CREATE INDEX "news_rels_path_idx" ON "news_rels" USING btree ("path");
  CREATE INDEX "news_rels_media_id_idx" ON "news_rels" USING btree ("media_id");
  CREATE INDEX "news_rels_courses_id_idx" ON "news_rels" USING btree ("courses_id");
  CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_cover_image_idx" ON "_news_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_news_v_version_seo_version_seo_image_idx" ON "_news_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v" USING btree ("version_slug");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_snapshot_idx" ON "_news_v" USING btree ("snapshot");
  CREATE INDEX "_news_v_published_locale_idx" ON "_news_v" USING btree ("published_locale");
  CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");
  CREATE INDEX "_news_v_autosave_idx" ON "_news_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_news_v_locales_locale_parent_id_unique" ON "_news_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_v_rels_order_idx" ON "_news_v_rels" USING btree ("order");
  CREATE INDEX "_news_v_rels_parent_idx" ON "_news_v_rels" USING btree ("parent_id");
  CREATE INDEX "_news_v_rels_path_idx" ON "_news_v_rels" USING btree ("path");
  CREATE INDEX "_news_v_rels_media_id_idx" ON "_news_v_rels" USING btree ("media_id");
  CREATE INDEX "_news_v_rels_courses_id_idx" ON "_news_v_rels" USING btree ("courses_id");
  CREATE INDEX "success_stories_course_idx" ON "success_stories" USING btree ("course_id");
  CREATE INDEX "success_stories_photo_idx" ON "success_stories" USING btree ("photo_id");
  CREATE INDEX "success_stories_video_idx" ON "success_stories" USING btree ("video_id");
  CREATE UNIQUE INDEX "success_stories_slug_idx" ON "success_stories" USING btree ("slug");
  CREATE INDEX "success_stories_order_idx" ON "success_stories" USING btree ("order");
  CREATE INDEX "success_stories_updated_at_idx" ON "success_stories" USING btree ("updated_at");
  CREATE INDEX "success_stories_created_at_idx" ON "success_stories" USING btree ("created_at");
  CREATE INDEX "success_stories__status_idx" ON "success_stories" USING btree ("_status");
  CREATE UNIQUE INDEX "success_stories_locales_locale_parent_id_unique" ON "success_stories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_success_stories_v_parent_idx" ON "_success_stories_v" USING btree ("parent_id");
  CREATE INDEX "_success_stories_v_version_version_course_idx" ON "_success_stories_v" USING btree ("version_course_id");
  CREATE INDEX "_success_stories_v_version_version_photo_idx" ON "_success_stories_v" USING btree ("version_photo_id");
  CREATE INDEX "_success_stories_v_version_version_video_idx" ON "_success_stories_v" USING btree ("version_video_id");
  CREATE INDEX "_success_stories_v_version_version_slug_idx" ON "_success_stories_v" USING btree ("version_slug");
  CREATE INDEX "_success_stories_v_version_version_order_idx" ON "_success_stories_v" USING btree ("version_order");
  CREATE INDEX "_success_stories_v_version_version_updated_at_idx" ON "_success_stories_v" USING btree ("version_updated_at");
  CREATE INDEX "_success_stories_v_version_version_created_at_idx" ON "_success_stories_v" USING btree ("version_created_at");
  CREATE INDEX "_success_stories_v_version_version__status_idx" ON "_success_stories_v" USING btree ("version__status");
  CREATE INDEX "_success_stories_v_created_at_idx" ON "_success_stories_v" USING btree ("created_at");
  CREATE INDEX "_success_stories_v_updated_at_idx" ON "_success_stories_v" USING btree ("updated_at");
  CREATE INDEX "_success_stories_v_snapshot_idx" ON "_success_stories_v" USING btree ("snapshot");
  CREATE INDEX "_success_stories_v_published_locale_idx" ON "_success_stories_v" USING btree ("published_locale");
  CREATE INDEX "_success_stories_v_latest_idx" ON "_success_stories_v" USING btree ("latest");
  CREATE INDEX "_success_stories_v_autosave_idx" ON "_success_stories_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_success_stories_v_locales_locale_parent_id_unique" ON "_success_stories_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "staff_photo_idx" ON "staff" USING btree ("photo_id");
  CREATE UNIQUE INDEX "staff_slug_idx" ON "staff" USING btree ("slug");
  CREATE INDEX "staff_order_idx" ON "staff" USING btree ("order");
  CREATE INDEX "staff_updated_at_idx" ON "staff" USING btree ("updated_at");
  CREATE INDEX "staff_created_at_idx" ON "staff" USING btree ("created_at");
  CREATE UNIQUE INDEX "staff_locales_locale_parent_id_unique" ON "staff_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_logo_idx" ON "partners" USING btree ("logo_id");
  CREATE UNIQUE INDEX "partners_slug_idx" ON "partners" USING btree ("slug");
  CREATE INDEX "partners_order_idx" ON "partners" USING btree ("order");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE UNIQUE INDEX "partners_locales_locale_parent_id_unique" ON "partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_source_file_idx" ON "media" USING btree ("source_file");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_wide_sizes_wide_filename_idx" ON "media" USING btree ("sizes_wide_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "leads_course_idx" ON "leads" USING btree ("course_id");
  CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_course_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("course_groups_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_success_stories_id_idx" ON "payload_locked_documents_rels" USING btree ("success_stories_id");
  CREATE INDEX "payload_locked_documents_rels_staff_id_idx" ON "payload_locked_documents_rels" USING btree ("staff_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_blocks_hero_order_idx" ON "homepage_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_parent_id_idx" ON "homepage_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_path_idx" ON "homepage_blocks_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero_video_idx" ON "homepage_blocks_hero" USING btree ("video_id");
  CREATE INDEX "homepage_blocks_hero_poster_idx" ON "homepage_blocks_hero" USING btree ("poster_id");
  CREATE UNIQUE INDEX "homepage_blocks_hero_locales_locale_parent_id_unique" ON "homepage_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_stats_items_order_idx" ON "homepage_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_stats_items_parent_id_idx" ON "homepage_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_stats_items_locales_locale_parent_id_unique" ON "homepage_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_stats_order_idx" ON "homepage_blocks_stats" USING btree ("_order");
  CREATE INDEX "homepage_blocks_stats_parent_id_idx" ON "homepage_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_stats_path_idx" ON "homepage_blocks_stats" USING btree ("_path");
  CREATE INDEX "homepage_blocks_course_groups_order_idx" ON "homepage_blocks_course_groups" USING btree ("_order");
  CREATE INDEX "homepage_blocks_course_groups_parent_id_idx" ON "homepage_blocks_course_groups" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_course_groups_path_idx" ON "homepage_blocks_course_groups" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_course_groups_locales_locale_parent_id_uniqu" ON "homepage_blocks_course_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_featured_courses_order_idx" ON "homepage_blocks_featured_courses" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_courses_parent_id_idx" ON "homepage_blocks_featured_courses" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_courses_path_idx" ON "homepage_blocks_featured_courses" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_featured_courses_locales_locale_parent_id_un" ON "homepage_blocks_featured_courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_why_items_order_idx" ON "homepage_blocks_why_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_why_items_parent_id_idx" ON "homepage_blocks_why_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_why_items_locales_locale_parent_id_unique" ON "homepage_blocks_why_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_why_pills_order_idx" ON "homepage_blocks_why_pills" USING btree ("_order");
  CREATE INDEX "homepage_blocks_why_pills_parent_id_idx" ON "homepage_blocks_why_pills" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_why_pills_locales_locale_parent_id_unique" ON "homepage_blocks_why_pills_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_why_order_idx" ON "homepage_blocks_why" USING btree ("_order");
  CREATE INDEX "homepage_blocks_why_parent_id_idx" ON "homepage_blocks_why" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_why_path_idx" ON "homepage_blocks_why" USING btree ("_path");
  CREATE INDEX "homepage_blocks_why_image_idx" ON "homepage_blocks_why" USING btree ("image_id");
  CREATE UNIQUE INDEX "homepage_blocks_why_locales_locale_parent_id_unique" ON "homepage_blocks_why_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_success_stories_order_idx" ON "homepage_blocks_success_stories" USING btree ("_order");
  CREATE INDEX "homepage_blocks_success_stories_parent_id_idx" ON "homepage_blocks_success_stories" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_success_stories_path_idx" ON "homepage_blocks_success_stories" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_success_stories_locales_locale_parent_id_uni" ON "homepage_blocks_success_stories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_staff_order_idx" ON "homepage_blocks_staff" USING btree ("_order");
  CREATE INDEX "homepage_blocks_staff_parent_id_idx" ON "homepage_blocks_staff" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_staff_path_idx" ON "homepage_blocks_staff" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_staff_locales_locale_parent_id_unique" ON "homepage_blocks_staff_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_videos_reels_order_idx" ON "homepage_blocks_videos_reels" USING btree ("_order");
  CREATE INDEX "homepage_blocks_videos_reels_parent_id_idx" ON "homepage_blocks_videos_reels" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_videos_reels_poster_idx" ON "homepage_blocks_videos_reels" USING btree ("poster_id");
  CREATE INDEX "homepage_blocks_videos_reels_video_idx" ON "homepage_blocks_videos_reels" USING btree ("video_id");
  CREATE INDEX "homepage_blocks_videos_reels_course_idx" ON "homepage_blocks_videos_reels" USING btree ("course_id");
  CREATE UNIQUE INDEX "homepage_blocks_videos_reels_locales_locale_parent_id_unique" ON "homepage_blocks_videos_reels_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_videos_order_idx" ON "homepage_blocks_videos" USING btree ("_order");
  CREATE INDEX "homepage_blocks_videos_parent_id_idx" ON "homepage_blocks_videos" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_videos_path_idx" ON "homepage_blocks_videos" USING btree ("_path");
  CREATE INDEX "homepage_blocks_videos_promo_promo_video_idx" ON "homepage_blocks_videos" USING btree ("promo_video_id");
  CREATE INDEX "homepage_blocks_videos_promo_promo_poster_idx" ON "homepage_blocks_videos" USING btree ("promo_poster_id");
  CREATE UNIQUE INDEX "homepage_blocks_videos_locales_locale_parent_id_unique" ON "homepage_blocks_videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_news_order_idx" ON "homepage_blocks_news" USING btree ("_order");
  CREATE INDEX "homepage_blocks_news_parent_id_idx" ON "homepage_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_news_path_idx" ON "homepage_blocks_news" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_news_locales_locale_parent_id_unique" ON "homepage_blocks_news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_partners_order_idx" ON "homepage_blocks_partners" USING btree ("_order");
  CREATE INDEX "homepage_blocks_partners_parent_id_idx" ON "homepage_blocks_partners" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_partners_path_idx" ON "homepage_blocks_partners" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_partners_locales_locale_parent_id_unique" ON "homepage_blocks_partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_employers_items_order_idx" ON "homepage_blocks_employers_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_employers_items_parent_id_idx" ON "homepage_blocks_employers_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_employers_items_locales_locale_parent_id_uni" ON "homepage_blocks_employers_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_employers_order_idx" ON "homepage_blocks_employers" USING btree ("_order");
  CREATE INDEX "homepage_blocks_employers_parent_id_idx" ON "homepage_blocks_employers" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_employers_path_idx" ON "homepage_blocks_employers" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_employers_locales_locale_parent_id_unique" ON "homepage_blocks_employers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_faq_items_order_idx" ON "homepage_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_faq_items_parent_id_idx" ON "homepage_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_faq_items_locales_locale_parent_id_unique" ON "homepage_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_faq_order_idx" ON "homepage_blocks_faq" USING btree ("_order");
  CREATE INDEX "homepage_blocks_faq_parent_id_idx" ON "homepage_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_faq_path_idx" ON "homepage_blocks_faq" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_faq_locales_locale_parent_id_unique" ON "homepage_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_register_bullets_order_idx" ON "homepage_blocks_register_bullets" USING btree ("_order");
  CREATE INDEX "homepage_blocks_register_bullets_parent_id_idx" ON "homepage_blocks_register_bullets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_blocks_register_bullets_locales_locale_parent_id_un" ON "homepage_blocks_register_bullets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_register_order_idx" ON "homepage_blocks_register" USING btree ("_order");
  CREATE INDEX "homepage_blocks_register_parent_id_idx" ON "homepage_blocks_register" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_register_path_idx" ON "homepage_blocks_register" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_register_locales_locale_parent_id_unique" ON "homepage_blocks_register_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_gallery_order_idx" ON "homepage_blocks_gallery" USING btree ("_order");
  CREATE INDEX "homepage_blocks_gallery_parent_id_idx" ON "homepage_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_gallery_path_idx" ON "homepage_blocks_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "homepage_blocks_gallery_locales_locale_parent_id_unique" ON "homepage_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_course_groups_id_idx" ON "homepage_rels" USING btree ("course_groups_id");
  CREATE INDEX "homepage_rels_courses_id_idx" ON "homepage_rels" USING btree ("courses_id");
  CREATE INDEX "homepage_rels_success_stories_id_idx" ON "homepage_rels" USING btree ("success_stories_id");
  CREATE INDEX "homepage_rels_staff_id_idx" ON "homepage_rels" USING btree ("staff_id");
  CREATE INDEX "homepage_rels_partners_id_idx" ON "homepage_rels" USING btree ("partners_id");
  CREATE INDEX "_homepage_v_blocks_hero_order_idx" ON "_homepage_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero_parent_id_idx" ON "_homepage_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero_path_idx" ON "_homepage_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_hero_video_idx" ON "_homepage_v_blocks_hero" USING btree ("video_id");
  CREATE INDEX "_homepage_v_blocks_hero_poster_idx" ON "_homepage_v_blocks_hero" USING btree ("poster_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_hero_locales_locale_parent_id_unique" ON "_homepage_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_stats_items_order_idx" ON "_homepage_v_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_stats_items_parent_id_idx" ON "_homepage_v_blocks_stats_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_stats_items_locales_locale_parent_id_uniq" ON "_homepage_v_blocks_stats_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_stats_order_idx" ON "_homepage_v_blocks_stats" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_stats_parent_id_idx" ON "_homepage_v_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_stats_path_idx" ON "_homepage_v_blocks_stats" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_course_groups_order_idx" ON "_homepage_v_blocks_course_groups" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_course_groups_parent_id_idx" ON "_homepage_v_blocks_course_groups" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_course_groups_path_idx" ON "_homepage_v_blocks_course_groups" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_course_groups_locales_locale_parent_id_un" ON "_homepage_v_blocks_course_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_featured_courses_order_idx" ON "_homepage_v_blocks_featured_courses" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_featured_courses_parent_id_idx" ON "_homepage_v_blocks_featured_courses" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_featured_courses_path_idx" ON "_homepage_v_blocks_featured_courses" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_featured_courses_locales_locale_parent_id" ON "_homepage_v_blocks_featured_courses_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_why_items_order_idx" ON "_homepage_v_blocks_why_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_why_items_parent_id_idx" ON "_homepage_v_blocks_why_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_why_items_locales_locale_parent_id_unique" ON "_homepage_v_blocks_why_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_why_pills_order_idx" ON "_homepage_v_blocks_why_pills" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_why_pills_parent_id_idx" ON "_homepage_v_blocks_why_pills" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_why_pills_locales_locale_parent_id_unique" ON "_homepage_v_blocks_why_pills_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_why_order_idx" ON "_homepage_v_blocks_why" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_why_parent_id_idx" ON "_homepage_v_blocks_why" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_why_path_idx" ON "_homepage_v_blocks_why" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_why_image_idx" ON "_homepage_v_blocks_why" USING btree ("image_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_why_locales_locale_parent_id_unique" ON "_homepage_v_blocks_why_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_success_stories_order_idx" ON "_homepage_v_blocks_success_stories" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_success_stories_parent_id_idx" ON "_homepage_v_blocks_success_stories" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_success_stories_path_idx" ON "_homepage_v_blocks_success_stories" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_success_stories_locales_locale_parent_id_" ON "_homepage_v_blocks_success_stories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_staff_order_idx" ON "_homepage_v_blocks_staff" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_staff_parent_id_idx" ON "_homepage_v_blocks_staff" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_staff_path_idx" ON "_homepage_v_blocks_staff" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_staff_locales_locale_parent_id_unique" ON "_homepage_v_blocks_staff_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_videos_reels_order_idx" ON "_homepage_v_blocks_videos_reels" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_videos_reels_parent_id_idx" ON "_homepage_v_blocks_videos_reels" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_videos_reels_poster_idx" ON "_homepage_v_blocks_videos_reels" USING btree ("poster_id");
  CREATE INDEX "_homepage_v_blocks_videos_reels_video_idx" ON "_homepage_v_blocks_videos_reels" USING btree ("video_id");
  CREATE INDEX "_homepage_v_blocks_videos_reels_course_idx" ON "_homepage_v_blocks_videos_reels" USING btree ("course_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_videos_reels_locales_locale_parent_id_uni" ON "_homepage_v_blocks_videos_reels_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_videos_order_idx" ON "_homepage_v_blocks_videos" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_videos_parent_id_idx" ON "_homepage_v_blocks_videos" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_videos_path_idx" ON "_homepage_v_blocks_videos" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_videos_promo_promo_video_idx" ON "_homepage_v_blocks_videos" USING btree ("promo_video_id");
  CREATE INDEX "_homepage_v_blocks_videos_promo_promo_poster_idx" ON "_homepage_v_blocks_videos" USING btree ("promo_poster_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_videos_locales_locale_parent_id_unique" ON "_homepage_v_blocks_videos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_news_order_idx" ON "_homepage_v_blocks_news" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_news_parent_id_idx" ON "_homepage_v_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_news_path_idx" ON "_homepage_v_blocks_news" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_news_locales_locale_parent_id_unique" ON "_homepage_v_blocks_news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_partners_order_idx" ON "_homepage_v_blocks_partners" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_partners_parent_id_idx" ON "_homepage_v_blocks_partners" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_partners_path_idx" ON "_homepage_v_blocks_partners" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_partners_locales_locale_parent_id_unique" ON "_homepage_v_blocks_partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_employers_items_order_idx" ON "_homepage_v_blocks_employers_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_employers_items_parent_id_idx" ON "_homepage_v_blocks_employers_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_employers_items_locales_locale_parent_id_" ON "_homepage_v_blocks_employers_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_employers_order_idx" ON "_homepage_v_blocks_employers" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_employers_parent_id_idx" ON "_homepage_v_blocks_employers" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_employers_path_idx" ON "_homepage_v_blocks_employers" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_employers_locales_locale_parent_id_unique" ON "_homepage_v_blocks_employers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_faq_items_order_idx" ON "_homepage_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_faq_items_parent_id_idx" ON "_homepage_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_homepage_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_faq_order_idx" ON "_homepage_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_faq_parent_id_idx" ON "_homepage_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_faq_path_idx" ON "_homepage_v_blocks_faq" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_faq_locales_locale_parent_id_unique" ON "_homepage_v_blocks_faq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_register_bullets_order_idx" ON "_homepage_v_blocks_register_bullets" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_register_bullets_parent_id_idx" ON "_homepage_v_blocks_register_bullets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_homepage_v_blocks_register_bullets_locales_locale_parent_id" ON "_homepage_v_blocks_register_bullets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_register_order_idx" ON "_homepage_v_blocks_register" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_register_parent_id_idx" ON "_homepage_v_blocks_register" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_register_path_idx" ON "_homepage_v_blocks_register" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_register_locales_locale_parent_id_unique" ON "_homepage_v_blocks_register_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_blocks_gallery_order_idx" ON "_homepage_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_gallery_parent_id_idx" ON "_homepage_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_gallery_path_idx" ON "_homepage_v_blocks_gallery" USING btree ("_path");
  CREATE UNIQUE INDEX "_homepage_v_blocks_gallery_locales_locale_parent_id_unique" ON "_homepage_v_blocks_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_snapshot_idx" ON "_homepage_v" USING btree ("snapshot");
  CREATE INDEX "_homepage_v_published_locale_idx" ON "_homepage_v" USING btree ("published_locale");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");
  CREATE INDEX "_homepage_v_autosave_idx" ON "_homepage_v" USING btree ("autosave");
  CREATE INDEX "_homepage_v_rels_order_idx" ON "_homepage_v_rels" USING btree ("order");
  CREATE INDEX "_homepage_v_rels_parent_idx" ON "_homepage_v_rels" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_rels_path_idx" ON "_homepage_v_rels" USING btree ("path");
  CREATE INDEX "_homepage_v_rels_course_groups_id_idx" ON "_homepage_v_rels" USING btree ("course_groups_id");
  CREATE INDEX "_homepage_v_rels_courses_id_idx" ON "_homepage_v_rels" USING btree ("courses_id");
  CREATE INDEX "_homepage_v_rels_success_stories_id_idx" ON "_homepage_v_rels" USING btree ("success_stories_id");
  CREATE INDEX "_homepage_v_rels_staff_id_idx" ON "_homepage_v_rels" USING btree ("staff_id");
  CREATE INDEX "_homepage_v_rels_partners_id_idx" ON "_homepage_v_rels" USING btree ("partners_id");
  CREATE INDEX "ui_texts_trust_order_idx" ON "ui_texts_trust" USING btree ("_order");
  CREATE INDEX "ui_texts_trust_parent_id_idx" ON "ui_texts_trust" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ui_texts_trust_locales_locale_parent_id_unique" ON "ui_texts_trust_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "ui_texts_locales_locale_parent_id_unique" ON "ui_texts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "gallery_videos_order_idx" ON "gallery_videos" USING btree ("_order");
  CREATE INDEX "gallery_videos_parent_id_idx" ON "gallery_videos" USING btree ("_parent_id");
  CREATE INDEX "gallery_videos_file_idx" ON "gallery_videos" USING btree ("file_id");
  CREATE INDEX "gallery_videos_thumbnail_idx" ON "gallery_videos" USING btree ("thumbnail_id");
  CREATE UNIQUE INDEX "gallery_videos_locales_locale_parent_id_unique" ON "gallery_videos_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "gallery_locales_locale_parent_id_unique" ON "gallery_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "gallery_rels_order_idx" ON "gallery_rels" USING btree ("order");
  CREATE INDEX "gallery_rels_parent_idx" ON "gallery_rels" USING btree ("parent_id");
  CREATE INDEX "gallery_rels_path_idx" ON "gallery_rels" USING btree ("path");
  CREATE INDEX "gallery_rels_media_id_idx" ON "gallery_rels" USING btree ("media_id");
  CREATE INDEX "site_settings_contact_phones_order_idx" ON "site_settings_contact_phones" USING btree ("_order");
  CREATE INDEX "site_settings_contact_phones_parent_id_idx" ON "site_settings_contact_phones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_contact_phones_locales_locale_parent_id_unique" ON "site_settings_contact_phones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_contact_opening_hours_order_idx" ON "site_settings_contact_opening_hours" USING btree ("_order");
  CREATE INDEX "site_settings_contact_opening_hours_parent_id_idx" ON "site_settings_contact_opening_hours" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_contact_opening_hours_locales_locale_parent_id" ON "site_settings_contact_opening_hours_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_social_order_idx" ON "site_settings_social" USING btree ("_order");
  CREATE INDEX "site_settings_social_parent_id_idx" ON "site_settings_social" USING btree ("_parent_id");
  CREATE INDEX "site_settings_leads_notification_emails_order_idx" ON "site_settings_leads_notification_emails" USING btree ("_order");
  CREATE INDEX "site_settings_leads_notification_emails_parent_id_idx" ON "site_settings_leads_notification_emails" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_light_idx" ON "site_settings" USING btree ("logo_light_id");
  CREATE INDEX "site_settings_logo_dark_idx" ON "site_settings" USING btree ("logo_dark_id");
  CREATE INDEX "site_settings_logo_mark_idx" ON "site_settings" USING btree ("logo_mark_id");
  CREATE INDEX "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
  CREATE INDEX "site_settings_seo_seo_og_image_idx" ON "site_settings" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_items_children_order_idx" ON "navigation_header_items_children" USING btree ("_order");
  CREATE INDEX "navigation_header_items_children_parent_id_idx" ON "navigation_header_items_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_items_children_link_link_course_idx" ON "navigation_header_items_children" USING btree ("link_course_id");
  CREATE INDEX "navigation_header_items_children_link_link_course_group_idx" ON "navigation_header_items_children" USING btree ("link_course_group_id");
  CREATE UNIQUE INDEX "navigation_header_items_children_locales_locale_parent_id_un" ON "navigation_header_items_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_items_order_idx" ON "navigation_header_items" USING btree ("_order");
  CREATE INDEX "navigation_header_items_parent_id_idx" ON "navigation_header_items" USING btree ("_parent_id");
  CREATE INDEX "navigation_header_items_link_link_course_idx" ON "navigation_header_items" USING btree ("link_course_id");
  CREATE INDEX "navigation_header_items_link_link_course_group_idx" ON "navigation_header_items" USING btree ("link_course_group_id");
  CREATE UNIQUE INDEX "navigation_header_items_locales_locale_parent_id_unique" ON "navigation_header_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_links_order_idx" ON "navigation_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_links_parent_id_idx" ON "navigation_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_links_link_link_course_idx" ON "navigation_footer_columns_links" USING btree ("link_course_id");
  CREATE INDEX "navigation_footer_columns_links_link_link_course_group_idx" ON "navigation_footer_columns_links" USING btree ("link_course_group_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_links_locales_locale_parent_id_uni" ON "navigation_footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_columns_order_idx" ON "navigation_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_parent_id_idx" ON "navigation_footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_footer_columns_locales_locale_parent_id_unique" ON "navigation_footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_footer_bottom_links_order_idx" ON "navigation_footer_bottom_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_bottom_links_parent_id_idx" ON "navigation_footer_bottom_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_bottom_links_link_link_course_idx" ON "navigation_footer_bottom_links" USING btree ("link_course_id");
  CREATE INDEX "navigation_footer_bottom_links_link_link_course_group_idx" ON "navigation_footer_bottom_links" USING btree ("link_course_group_id");
  CREATE UNIQUE INDEX "navigation_footer_bottom_links_locales_locale_parent_id_uniq" ON "navigation_footer_bottom_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_header_cta_link_header_cta_link_course_idx" ON "navigation" USING btree ("header_cta_link_course_id");
  CREATE INDEX "navigation_header_cta_link_header_cta_link_course_group_idx" ON "navigation" USING btree ("header_cta_link_course_group_id");
  CREATE UNIQUE INDEX "navigation_locales_locale_parent_id_unique" ON "navigation_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "courses_topics" CASCADE;
  DROP TABLE "courses_topics_locales" CASCADE;
  DROP TABLE "courses_highlights" CASCADE;
  DROP TABLE "courses_highlights_locales" CASCADE;
  DROP TABLE "courses_schedule" CASCADE;
  DROP TABLE "courses_admission_other" CASCADE;
  DROP TABLE "courses_admission_other_locales" CASCADE;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_locales" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "_courses_v_version_topics" CASCADE;
  DROP TABLE "_courses_v_version_topics_locales" CASCADE;
  DROP TABLE "_courses_v_version_highlights" CASCADE;
  DROP TABLE "_courses_v_version_highlights_locales" CASCADE;
  DROP TABLE "_courses_v_version_schedule" CASCADE;
  DROP TABLE "_courses_v_version_admission_other" CASCADE;
  DROP TABLE "_courses_v_version_admission_other_locales" CASCADE;
  DROP TABLE "_courses_v" CASCADE;
  DROP TABLE "_courses_v_locales" CASCADE;
  DROP TABLE "_courses_v_rels" CASCADE;
  DROP TABLE "course_groups" CASCADE;
  DROP TABLE "course_groups_locales" CASCADE;
  DROP TABLE "_course_groups_v" CASCADE;
  DROP TABLE "_course_groups_v_locales" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "news_locales" CASCADE;
  DROP TABLE "news_rels" CASCADE;
  DROP TABLE "_news_v" CASCADE;
  DROP TABLE "_news_v_locales" CASCADE;
  DROP TABLE "_news_v_rels" CASCADE;
  DROP TABLE "success_stories" CASCADE;
  DROP TABLE "success_stories_locales" CASCADE;
  DROP TABLE "_success_stories_v" CASCADE;
  DROP TABLE "_success_stories_v_locales" CASCADE;
  DROP TABLE "staff" CASCADE;
  DROP TABLE "staff_locales" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "homepage_blocks_hero" CASCADE;
  DROP TABLE "homepage_blocks_hero_locales" CASCADE;
  DROP TABLE "homepage_blocks_stats_items" CASCADE;
  DROP TABLE "homepage_blocks_stats_items_locales" CASCADE;
  DROP TABLE "homepage_blocks_stats" CASCADE;
  DROP TABLE "homepage_blocks_course_groups" CASCADE;
  DROP TABLE "homepage_blocks_course_groups_locales" CASCADE;
  DROP TABLE "homepage_blocks_featured_courses" CASCADE;
  DROP TABLE "homepage_blocks_featured_courses_locales" CASCADE;
  DROP TABLE "homepage_blocks_why_items" CASCADE;
  DROP TABLE "homepage_blocks_why_items_locales" CASCADE;
  DROP TABLE "homepage_blocks_why_pills" CASCADE;
  DROP TABLE "homepage_blocks_why_pills_locales" CASCADE;
  DROP TABLE "homepage_blocks_why" CASCADE;
  DROP TABLE "homepage_blocks_why_locales" CASCADE;
  DROP TABLE "homepage_blocks_success_stories" CASCADE;
  DROP TABLE "homepage_blocks_success_stories_locales" CASCADE;
  DROP TABLE "homepage_blocks_staff" CASCADE;
  DROP TABLE "homepage_blocks_staff_locales" CASCADE;
  DROP TABLE "homepage_blocks_videos_reels" CASCADE;
  DROP TABLE "homepage_blocks_videos_reels_locales" CASCADE;
  DROP TABLE "homepage_blocks_videos" CASCADE;
  DROP TABLE "homepage_blocks_videos_locales" CASCADE;
  DROP TABLE "homepage_blocks_news" CASCADE;
  DROP TABLE "homepage_blocks_news_locales" CASCADE;
  DROP TABLE "homepage_blocks_partners" CASCADE;
  DROP TABLE "homepage_blocks_partners_locales" CASCADE;
  DROP TABLE "homepage_blocks_employers_items" CASCADE;
  DROP TABLE "homepage_blocks_employers_items_locales" CASCADE;
  DROP TABLE "homepage_blocks_employers" CASCADE;
  DROP TABLE "homepage_blocks_employers_locales" CASCADE;
  DROP TABLE "homepage_blocks_faq_items" CASCADE;
  DROP TABLE "homepage_blocks_faq_items_locales" CASCADE;
  DROP TABLE "homepage_blocks_faq" CASCADE;
  DROP TABLE "homepage_blocks_faq_locales" CASCADE;
  DROP TABLE "homepage_blocks_register_bullets" CASCADE;
  DROP TABLE "homepage_blocks_register_bullets_locales" CASCADE;
  DROP TABLE "homepage_blocks_register" CASCADE;
  DROP TABLE "homepage_blocks_register_locales" CASCADE;
  DROP TABLE "homepage_blocks_gallery" CASCADE;
  DROP TABLE "homepage_blocks_gallery_locales" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_stats_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_stats_items_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_stats" CASCADE;
  DROP TABLE "_homepage_v_blocks_course_groups" CASCADE;
  DROP TABLE "_homepage_v_blocks_course_groups_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_featured_courses" CASCADE;
  DROP TABLE "_homepage_v_blocks_featured_courses_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_why_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_why_items_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_why_pills" CASCADE;
  DROP TABLE "_homepage_v_blocks_why_pills_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_why" CASCADE;
  DROP TABLE "_homepage_v_blocks_why_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_success_stories" CASCADE;
  DROP TABLE "_homepage_v_blocks_success_stories_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_staff" CASCADE;
  DROP TABLE "_homepage_v_blocks_staff_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_videos_reels" CASCADE;
  DROP TABLE "_homepage_v_blocks_videos_reels_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_videos" CASCADE;
  DROP TABLE "_homepage_v_blocks_videos_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_news" CASCADE;
  DROP TABLE "_homepage_v_blocks_news_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_partners" CASCADE;
  DROP TABLE "_homepage_v_blocks_partners_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_employers_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_employers_items_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_employers" CASCADE;
  DROP TABLE "_homepage_v_blocks_employers_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_faq_items" CASCADE;
  DROP TABLE "_homepage_v_blocks_faq_items_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_faq" CASCADE;
  DROP TABLE "_homepage_v_blocks_faq_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_register_bullets" CASCADE;
  DROP TABLE "_homepage_v_blocks_register_bullets_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_register" CASCADE;
  DROP TABLE "_homepage_v_blocks_register_locales" CASCADE;
  DROP TABLE "_homepage_v_blocks_gallery" CASCADE;
  DROP TABLE "_homepage_v_blocks_gallery_locales" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  DROP TABLE "_homepage_v_rels" CASCADE;
  DROP TABLE "ui_texts_trust" CASCADE;
  DROP TABLE "ui_texts_trust_locales" CASCADE;
  DROP TABLE "ui_texts" CASCADE;
  DROP TABLE "ui_texts_locales" CASCADE;
  DROP TABLE "gallery_videos" CASCADE;
  DROP TABLE "gallery_videos_locales" CASCADE;
  DROP TABLE "gallery" CASCADE;
  DROP TABLE "gallery_locales" CASCADE;
  DROP TABLE "gallery_rels" CASCADE;
  DROP TABLE "site_settings_contact_phones" CASCADE;
  DROP TABLE "site_settings_contact_phones_locales" CASCADE;
  DROP TABLE "site_settings_contact_opening_hours" CASCADE;
  DROP TABLE "site_settings_contact_opening_hours_locales" CASCADE;
  DROP TABLE "site_settings_social" CASCADE;
  DROP TABLE "site_settings_leads_notification_emails" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "navigation_header_items_children" CASCADE;
  DROP TABLE "navigation_header_items_children_locales" CASCADE;
  DROP TABLE "navigation_header_items" CASCADE;
  DROP TABLE "navigation_header_items_locales" CASCADE;
  DROP TABLE "navigation_footer_columns_links" CASCADE;
  DROP TABLE "navigation_footer_columns_links_locales" CASCADE;
  DROP TABLE "navigation_footer_columns" CASCADE;
  DROP TABLE "navigation_footer_columns_locales" CASCADE;
  DROP TABLE "navigation_footer_bottom_links" CASCADE;
  DROP TABLE "navigation_footer_bottom_links_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_courses_schedule";
  DROP TYPE "public"."enum_courses_status";
  DROP TYPE "public"."enum__courses_v_version_schedule";
  DROP TYPE "public"."enum__courses_v_version_status";
  DROP TYPE "public"."enum__courses_v_published_locale";
  DROP TYPE "public"."enum_course_groups_status";
  DROP TYPE "public"."enum__course_groups_v_version_status";
  DROP TYPE "public"."enum__course_groups_v_published_locale";
  DROP TYPE "public"."enum_news_kind";
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum__news_v_version_kind";
  DROP TYPE "public"."enum__news_v_version_status";
  DROP TYPE "public"."enum__news_v_published_locale";
  DROP TYPE "public"."enum_success_stories_status";
  DROP TYPE "public"."enum__success_stories_v_version_status";
  DROP TYPE "public"."enum__success_stories_v_published_locale";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_leads_locale";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_homepage_status";
  DROP TYPE "public"."enum__homepage_v_version_status";
  DROP TYPE "public"."enum__homepage_v_published_locale";
  DROP TYPE "public"."enum_site_settings_social_platform";
  DROP TYPE "public"."enum_navigation_header_items_children_link_type";
  DROP TYPE "public"."enum_navigation_header_items_children_link_page";
  DROP TYPE "public"."enum_navigation_header_items_link_type";
  DROP TYPE "public"."enum_navigation_header_items_link_page";
  DROP TYPE "public"."enum_navigation_footer_columns_links_link_type";
  DROP TYPE "public"."enum_navigation_footer_columns_links_link_page";
  DROP TYPE "public"."enum_navigation_footer_bottom_links_link_type";
  DROP TYPE "public"."enum_navigation_footer_bottom_links_link_page";
  DROP TYPE "public"."enum_navigation_header_cta_link_type";
  DROP TYPE "public"."enum_navigation_header_cta_link_page";`)
}
