import net from "node:net";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openPostgres } from "@/features/signing/server/db";

/**
 * Supabase's transaction pooler never answers a query that was pipelined onto a busy connection,
 * and the documents pages hung (2026-09-29, again 2026-09-30 with max_pipeline 1). This fake
 * Postgres answers every message in order after a short delay and counts the queries that arrive
 * on a connection while an earlier one is still unanswered.
 */
function frame(type: string, body: Buffer = Buffer.alloc(0)) {
  const head = Buffer.alloc(5);
  head.write(type, 0);
  head.writeInt32BE(body.length + 4, 1);
  return Buffer.concat([head, body]);
}
const ready = frame("Z", Buffer.from("I"));
const done = frame("C", Buffer.from("SELECT 0\0"));

let pipelined = 0;
const sockets = new Set<net.Socket>();
const server = net.createServer((sock) => {
  sockets.add(sock);
  let buf = Buffer.alloc(0);
  let started = false;
  let unit: string[] = [];
  let paramCount = 0;
  const pending: Buffer[] = [];
  let answering = false;
  const answer = () => {
    if (answering || !pending.length) return;
    answering = true;
    setTimeout(() => {
      sock.write(pending.shift()!);
      answering = false;
      answer();
    }, 40);
  };
  const push = (reply: Buffer) => {
    if (pending.length || answering) pipelined++;
    pending.push(reply);
    answer();
  };
  sock.on("error", () => {});
  sock.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      if (!started) {
        if (buf.length < 4 || buf.length < buf.readInt32BE(0)) return;
        buf = buf.subarray(buf.readInt32BE(0));
        started = true;
        const auth = Buffer.alloc(4);
        sock.write(Buffer.concat([frame("R", auth), frame("K", Buffer.alloc(8)), ready]));
        continue;
      }
      if (buf.length < 5 || buf.length < buf.readInt32BE(1) + 1) return;
      const type = String.fromCharCode(buf[0]);
      const body = buf.subarray(5, buf.readInt32BE(1) + 1);
      buf = buf.subarray(buf.readInt32BE(1) + 1);
      unit.push(type);
      if (type === "P") {
        const afterName = body.indexOf(0) + 1;
        paramCount = body.readInt16BE(body.indexOf(0, afterName) + 1);
      }
      if (type === "Q") {
        push(Buffer.concat([done, ready]));
      } else if (type === "H") {
        // describe-first round: ParseComplete, ParameterDescription (int4 each), NoData
        const pd = Buffer.alloc(2 + 4 * paramCount);
        pd.writeInt16BE(paramCount, 0);
        for (let i = 0; i < paramCount; i++) pd.writeInt32BE(23, 2 + 4 * i);
        push(Buffer.concat([frame("1"), frame("t", pd), frame("n")]));
      } else if (type === "S") {
        push(
          Buffer.concat([
            ...(unit.includes("P") ? [frame("1")] : []),
            ...(unit.includes("B") ? [frame("2")] : []),
            ...(unit.includes("D") ? [frame("n")] : []),
            ...(unit.includes("E") ? [done] : []),
            ready,
          ]),
        );
      } else if (type === "X") {
        sock.end();
      } else continue;
      unit = [];
    }
  });
});

let port = 0;
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as net.AddressInfo).port;
});
afterAll(() => {
  for (const s of sockets) s.destroy(); // the pools' idle connections
  return new Promise<void>((resolve) => server.close(() => resolve()));
});

/** Like /admin/documents on a warm server: 6 queries at once plus the menu's 2, on a pool of 5. */
const burst = (query: (i: number) => Promise<unknown>) =>
  Promise.all(Array.from({ length: 5 }, (_, i) => query(i)))
    .then(() => (pipelined = 0))
    .then(() => Promise.all(Array.from({ length: 8 }, (_, i) => query(i))))
    .then(() => pipelined);

const url = () => `postgres://u:p@127.0.0.1:${port}/d`;

describe("signing database connection", () => {
  it("never sends a query down a connection that is still busy", async () => {
    const db = openPostgres(url());
    expect(await burst((i) => (i % 2 ? db.query("select $1::int", [i]) : db.query("select 1")))).toBe(0);
  });

  it("still runs transactions next to other queries", async () => {
    const db = openPostgres(url());
    pipelined = 0;
    const tx = db.tx(async (t) => {
      await t.query("select $1::int", [1]);
      await t.query("select 1");
      return "ok";
    });
    const others = Array.from({ length: 7 }, () => db.query("select 1"));
    expect(await tx).toBe("ok");
    await Promise.all(others);
    expect(pipelined).toBe(0);
  });

  it("(the check works: postgres.js alone, even with max_pipeline 1, does pipeline)", async () => {
    const sql = postgres({ host: "127.0.0.1", port, user: "u", database: "d", ssl: false, prepare: false, max: 5, max_pipeline: 1 } as object);
    try {
      expect(await burst((i) => (i % 2 ? sql.unsafe("select $1::int", [i]) : sql.unsafe("select 1", [])))).toBeGreaterThan(0);
    } finally {
      await sql.end({ timeout: 0 });
    }
  });
});
