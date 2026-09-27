/** Building the message the admin pastes into WhatsApp (pure — no secrets here). */

export function buildShareMessage(parts: { template?: string | null; description?: string | null; url: string }): string {
  return [parts.template?.trim(), parts.description?.trim(), parts.url].filter(Boolean).join("\n\n");
}

/** wa.me link; without a phone number WhatsApp lets the admin pick the chat. */
export function whatsappUrl(message: string, phone?: string | null): string {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function signingUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/sign/${token}`;
}
