import "server-only";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

const SESSION_DAYS = 7;
// Hash real de una clave cualquiera: se usa para que el tiempo de respuesta no delate si el email existe
const DUMMY_HASH = "$2b$12$055Erd5WWrazYU.GOT5WgOvPsf12PpYlsK1ck/3d6CwsMvfi5dhyS";

// Límite simple de intentos de login por IP (en memoria, se reinicia con el servidor)
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 10 * 60_000;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await clientIp();
  const entry = attempts.get(ip);
  if (entry && entry.count >= MAX_ATTEMPTS && entry.until > Date.now()) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  const user = await db.query.adminUsers.findFirst({ where: eq(adminUsers.email, email.trim().toLowerCase()) });
  // Se compara igual aunque el usuario no exista, para no revelar qué emails están registrados
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    const count = (entry && entry.until > Date.now() ? entry.count : 0) + 1;
    attempts.set(ip, { count, until: Date.now() + LOCK_MS });
    return { ok: false, error: "Email o contraseña incorrectos." };
  }

  attempts.delete(ip);
  const token = await signSession({ sub: user.id, email: user.email, name: user.name }, SESSION_DAYS);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

/** Usar al comienzo de cada página y acción del panel (además del proxy) */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
