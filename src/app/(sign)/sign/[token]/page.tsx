import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getDb } from "@/features/signing/server/db";
import { rateLimit } from "@/features/signing/server/rate-limit";
import { requestInfo } from "@/features/signing/server/request-info";
import { cookieNames, logOpened, resolveToken, viewFor } from "@/features/signing/server/services/signing";
import { SignFlow } from "./SignFlow";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("sign"))("title"), referrer: "no-referrer" };
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const resolved = await resolveToken(db, token);
  const jar = await cookies();
  const names = resolved ? cookieNames(resolved.tokenHash) : null;
  const view = await viewFor(db, resolved, {
    session: names ? jar.get(names.session)?.value : undefined,
    done: names ? jar.get(names.done)?.value : undefined,
  });

  const client = await requestInfo();
  if (resolved && (view.state === "name" || view.state === "sign") && !isLinkPreview(client.userAgent)) {
    const first = await rateLimit(`opened:${resolved.tokenHash.slice(0, 24)}:${client.ip ?? "?"}`, 60 * 60, 1);
    await logOpened(db, resolved, client, first);
  }

  return <SignFlow token={token} view={view} />;
}

/**
 * WhatsApp/Telegram/etc. fetch the link once to draw a preview when the admin sends it.
 * That isn't the client opening it — don't put "link opened" in the history for it.
 */
function isLinkPreview(userAgent: string | null): boolean {
  return (
    !!userAgent &&
    /whatsapp\/|facebookexternalhit|facebot|telegrambot|twitterbot|slackbot|discordbot|skypeuripreview|linkedinbot|googlebot|bingbot/i.test(userAgent)
  );
}
