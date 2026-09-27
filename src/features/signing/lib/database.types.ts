/**
 * Database types for supabase-js, matching supabase/migrations.
 * Same shape as `supabase gen types typescript` output — regenerate with the
 * Supabase CLI once a project exists, or keep in sync by hand.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LinkMode = "per_signer" | "shared";
export type DocumentStatus = "draft" | "pending" | "signed" | "finalized";
export type SignerStatus = "pending" | "signed";
export type SignatureMethod = "draw" | "typed" | "checkbox";
export type AuditEventType =
  | "created"
  | "updated"
  | "deleted"
  | "link_copied"
  | "link_revoked"
  | "link_regenerated"
  | "link_reset"
  | "opened"
  | "id_failed"
  | "id_locked"
  | "id_verified"
  | "signed"
  | "placed"
  | "finalized"
  | "unlocked"
  | "moved_to_signed"
  | "moved_back";

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type AdminProfileRow = {
  user_id: string;
  display_name: string;
  saved_signature_path: string | null;
  locale: "he" | "ar";
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  file_name: string | null;
  original_pdf_path: string | null;
  original_sha256: string | null;
  original_size_bytes: number | null;
  final_pdf_path: string | null;
  final_sha256: string | null;
  final_size_bytes: number | null;
  page_count: number | null;
  link_mode: LinkMode;
  shared_token_hash: string | null;
  shared_token_enc: string | null;
  max_signers: number | null;
  admin_signs: boolean;
  status: DocumentStatus;
  in_signed_section: boolean;
  moved_to_signed_at: string | null;
  finalized_at: string | null;
  deleted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SignerRow = {
  id: string;
  document_id: string;
  name: string;
  id_number_hash: string | null;
  id_number_last3: string | null;
  phone: string | null;
  token_hash: string | null;
  token_enc: string | null;
  is_admin: boolean;
  admin_user_id: string | null;
  status: SignerStatus;
  failed_attempts: number;
  locked: boolean;
  signature_path: string | null;
  signature_method: SignatureMethod | null;
  signed_at: string | null;
  signed_ip: string | null;
  signed_user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export type PlacementRow = {
  id: string;
  document_id: string;
  signer_id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
};

export type SettingsRow = {
  id: boolean;
  allow_typed_signature: boolean;
  allow_checkbox_signature: boolean;
  default_link_mode: LinkMode;
  message_template: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  document_id: string;
  signer_id: string | null;
  created_at: string;
  read_at: string | null;
};

export type AuditEventRow = {
  id: number;
  document_id: string;
  signer_id: string | null;
  event: AuditEventType;
  actor_user_id: string | null;
  details: Json;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

export type SharedLinkAttemptRow = {
  document_id: string;
  device_key: string;
  failed_attempts: number;
  locked: boolean;
  updated_at: string;
};

export type RateLimitRow = {
  key: string;
  window_start: string;
  hits: number;
};

type FailureResult = { failed_attempts: number; locked: boolean }[];

export type Database = {
  public: {
    Tables: {
      admin_profiles: Table<AdminProfileRow, "user_id">;
      documents: Table<DocumentRow, "title">;
      signers: Table<SignerRow, "document_id" | "name">;
      placements: Table<PlacementRow, "document_id" | "signer_id" | "page" | "x" | "y" | "width" | "height">;
      settings: Table<SettingsRow, never>;
      notifications: Table<NotificationRow, "document_id">;
      audit_events: Table<AuditEventRow, "document_id" | "event">;
      shared_link_attempts: Table<SharedLinkAttemptRow, "document_id" | "device_key">;
      rate_limits: Table<RateLimitRow, "key" | "window_start">;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      rate_limit_hit: { Args: { p_key: string; p_window_seconds: number; p_max: number }; Returns: boolean };
      signer_register_failure: { Args: { p_signer_id: string; p_max: number }; Returns: FailureResult };
      shared_register_failure: {
        Args: { p_document_id: string; p_device_key: string; p_max: number };
        Returns: FailureResult;
      };
    };
    Enums: {
      link_mode: LinkMode;
      document_status: DocumentStatus;
      signer_status: SignerStatus;
      signature_method: SignatureMethod;
      audit_event_type: AuditEventType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
