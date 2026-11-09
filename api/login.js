import { makeSessionCookie, roleForPassword } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const role = roleForPassword(body.password);
  if (!role) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return res.status(401).json({ error: "Wrong password" });
  }
  res.setHeader("Set-Cookie", makeSessionCookie(role));
  res.status(200).json({ ok: true, role });
}
