import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getDb } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { requestInfo } from "@/server/request-info";
import { cookieNames, DEVICE_COOKIE, logOpened, resolveToken, viewFor } from "@/server/services/signing";
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
    deviceId: jar.get(DEVICE_COOKIE)?.value,
  });

  if (resolved && view.state === "verify") {
    const client = await requestInfo();
    const first = await rateLimit(`opened:${resolved.tokenHash.slice(0, 24)}:${client.ip ?? "?"}`, 60 * 60, 1);
    await logOpened(db, resolved, client, first);
  }

  return <SignFlow token={token} view={view} />;
}
