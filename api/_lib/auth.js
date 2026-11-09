import crypto from "node:crypto";

const COOKIE = "rp_session";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function sign(value) {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("base64url");
}
function same(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// Ron and Ellen sign in with EDIT_PASSWORD; Rene signs in with VIEW_PASSWORD.
export function roleForPassword(given) {
  if (typeof given !== "string" || !given) return null;
  if (process.env.EDIT_PASSWORD && same(given, process.env.EDIT_PASSWORD)) return "editor";
  if (process.env.VIEW_PASSWORD && same(given, process.env.VIEW_PASSWORD)) return "viewer";
  return null;
}

export function makeSessionCookie(role) {
  const payload = `${role}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}
export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function sessionRole(req) {
  if (!process.env.SESSION_SECRET) return null;
  const raw = (req.headers.cookie || "").split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!raw) return null;
  const [role, exp, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!role || !exp || !sig) return null;
  const good = sign(`${role}.${exp}`);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return role === "editor" || role === "viewer" ? role : null;
}
