import { neon } from "@neondatabase/serverless";
import { sessionRole } from "./_lib/auth.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const role = sessionRole(req);
  if (!role) return res.status(401).json({ error: "Sign in first" });
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === "GET") {
    const [settings] = await sql`SELECT value FROM settings WHERE key = 'sale'`;
    const entries = await sql`SELECT id, to_char(date, 'YYYY-MM-DD') AS date, kind, amount::float AS amount, note
                              FROM entries ORDER BY date, kind DESC, id`;
    return res.status(200).json({ role, settings: settings?.value || {}, entries });
  }

  if (req.method === "POST") {
    // Only Ron and Ellen can change anything; Rene's sign-in is view-only.
    if (role !== "editor") return res.status(403).json({ error: "View-only access" });
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const ok = (e) =>
      e && DATE.test(e.date || "") && (e.kind === "payment" || e.kind === "credit") &&
      Number.isFinite(+e.amount) && +e.amount >= 0 && +e.amount < 100000000 && String(e.note ?? "").length <= 500;
    if (b.action === "add") {
      if (!ok(b.entry)) return res.status(400).json({ error: "Check the date and amount" });
      const e = b.entry;
      const [row] = await sql`INSERT INTO entries (date, kind, amount, note) VALUES (${e.date}, ${e.kind}, ${+e.amount}, ${String(e.note || "")}) RETURNING id`;
      return res.status(200).json({ ok: true, id: row.id });
    }
    if (b.action === "update") {
      if (!Number.isInteger(b.id) || !ok(b.entry)) return res.status(400).json({ error: "Check the date and amount" });
      const e = b.entry;
      await sql`UPDATE entries SET date = ${e.date}, kind = ${e.kind}, amount = ${+e.amount}, note = ${String(e.note || "")}, updated_at = now() WHERE id = ${b.id}`;
      return res.status(200).json({ ok: true });
    }
    if (b.action === "delete") {
      if (!Number.isInteger(b.id)) return res.status(400).json({ error: "Missing entry" });
      await sql`DELETE FROM entries WHERE id = ${b.id}`;
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  }
  res.status(405).json({ error: "GET or POST only" });
}
