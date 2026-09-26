import "server-only";
import type { SettingsDto } from "@/lib/domain";
import type { Db } from "@/server/db";

export async function getSettings(db: Db): Promise<SettingsDto> {
  const [row] = await db.query<SettingsDto>(
    `select allow_typed_signature, allow_checkbox_signature, default_link_mode, message_template
       from public.settings where id`,
  );
  return (
    row ?? { allow_typed_signature: false, allow_checkbox_signature: false, default_link_mode: "per_signer", message_template: "" }
  );
}

export async function updateSettings(db: Db, s: SettingsDto): Promise<void> {
  await db.query(
    `insert into public.settings (id, allow_typed_signature, allow_checkbox_signature, default_link_mode, message_template)
     values (true, $1, $2, $3, $4)
     on conflict (id) do update set
       allow_typed_signature = excluded.allow_typed_signature,
       allow_checkbox_signature = excluded.allow_checkbox_signature,
       default_link_mode = excluded.default_link_mode,
       message_template = excluded.message_template`,
    [s.allow_typed_signature, s.allow_checkbox_signature, s.default_link_mode, s.message_template],
  );
}
